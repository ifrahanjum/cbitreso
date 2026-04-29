require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');
const { validateStudent, validateFaculty } = require('./auth');

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: Missing required environment variables:');
  missingEnv.forEach(key => console.error(` - ${key}`));
  console.error('The server cannot start without these variables. Please check your .env file.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3002;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://reso.cbit.ac.in']
    : [process.env.CORS_ORIGIN || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));
app.use(morgan('dev'));
app.use(express.json());

let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch {
  rateLimit = null;
  console.warn(' express-rate-limit not installed — rate limiting disabled');
}

let authLimiter, browseLimiter, uploadLimiter;
if (rateLimit) {
  authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
    message: { success: false, error: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' }
  });
  browseLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
    message: { success: false, error: 'RATE_LIMITED', message: 'Too many requests. Slow down.' }
  });
  uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false,
    message: { success: false, error: 'RATE_LIMITED', message: 'Upload limit reached. Try again in an hour.' },
    validate: { xForwardedForHeader: false }
  });
}

app.get('/', (req, res) => res.json({ message: 'reso API — CBIT Academic Resource Hub' }));
app.get('/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString(), v: '1.2.0-auth-fixed' }));

const authRouter = express.Router();

authRouter.post('/login', async (req, res) => {
  try {
    const { type, identifier, password } = req.body;
    if (!type || !identifier || !password) return res.status(400).json({ error: 'type, identifier, and password are required' });

    let validation;
    if (type === 'student') validation = validateStudent(identifier, password);
    else if (type === 'faculty') validation = validateFaculty(identifier, password);
    else return res.status(400).json({ error: 'type must be "student" or "faculty"' });

    if (!validation.valid) return res.status(401).json({ error: validation.error });

    const authEmail = validation.syntheticEmail || validation.email;
    const authPassword = validation.dept.toLowerCase();

    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });

    if (signInError && signInError.message.includes('Invalid login credentials')) {
      const { error: createError } = await supabase.auth.admin.createUser({
        email: authEmail, password: authPassword, email_confirm: true,
        user_metadata: { role: validation.role, dept: validation.dept, display_name: validation.displayName, identifier: validation.identifier }
      });
      if (createError) return res.status(500).json({ error: 'Failed to create user account' });

      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (retryError) return res.status(500).json({ error: 'Account created but sign-in failed. Try again.' });
      signInData = retryData;
    } else if (signInError) {
      return res.status(500).json({ error: 'Authentication service error' });
    }

    const userId = signInData.user.id;
    await supabase.from('users').upsert({
      id: userId, name: validation.displayName, email: authEmail, role: validation.role,
      roll_no: type === 'student' ? validation.identifier : null,
      department_code: validation.dept, identifier_type: type, updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    return res.json({
      session: { access_token: signInData.session.access_token, refresh_token: signInData.session.refresh_token, expires_at: signInData.session.expires_at },
      user: { id: userId, identifier: validation.identifier, displayName: validation.displayName, role: validation.role, dept: validation.dept, type }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

authRouter.post('/logout', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (accessToken) {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) await supabase.auth.admin.signOut(user.id);
    }
    return res.json({ success: true });
  } catch { return res.json({ success: true }); }
});

authRouter.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No authorization token provided' });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid or expired token' });

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!profile) {
      return res.json({ id: user.id, displayName: user.user_metadata?.display_name || user.email, role: user.user_metadata?.role || 'student', dept: user.user_metadata?.dept || '' });
    }
    return res.json({ id: profile.id, identifier: profile.roll_no || profile.email, displayName: profile.name, role: profile.role, dept: profile.department_code, type: profile.identifier_type });
  } catch (err) { return res.status(500).json({ error: 'Internal server error' }); }
});

if (authLimiter) app.use('/auth', authLimiter, authRouter);
else app.use('/auth', authRouter);

const taxonomyRoutes = require('./routes/taxonomy');
const resourceRoutes = require('./routes/resources');
const uploadRoutes = require('./routes/upload');
const searchRoutes = require('./routes/search');

app.use('/search', searchRoutes);

if (browseLimiter) {
  app.use(browseLimiter, taxonomyRoutes);
  app.use('/resources', browseLimiter, resourceRoutes);
} else {
  app.use(taxonomyRoutes);
  app.use('/resources', resourceRoutes);
}

if (uploadLimiter) {
  app.use('/resources', uploadLimiter, uploadRoutes);
} else {
  app.use('/resources', uploadRoutes);
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
