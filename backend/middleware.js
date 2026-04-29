
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header'
      });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, name, email, role, department_code, identifier_type, roll_no')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      req.user = {
        id: user.id,
        name: user.user_metadata?.display_name || user.email,
        email: user.email,
        role: user.user_metadata?.role || 'student',
        dept: user.user_metadata?.dept || '',
        type: user.user_metadata?.role || 'student'
      };
    } else {
      req.user = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        dept: profile.department_code,
        type: profile.identifier_type,
        rollNo: profile.roll_no
      };
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Authentication service error'
    });
  }
}


function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}


function authorizeOwnerOrAdmin(req, res, next) {
  const resource = req.resource;
  if (!resource) {
    return res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: 'Resource not found'
    });
  }

  if (resource.uploaded_by === req.user.id || req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'FORBIDDEN',
    message: 'You can only modify your own uploads'
  });
}


async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data, error } = await supabase.auth.getUser(token);
      
      // DEBUG LOG
      require('fs').appendFileSync('auth_debug.log', `[${new Date().toISOString()}] Token check: ${token.substring(0,10)}... User found: ${!!data?.user} Error: ${error?.message || 'none'}\n`);

      if (data?.user) {
        req.user = { id: data.user.id };
      }
    }
  } catch (err) {
    require('fs').appendFileSync('auth_debug.log', `[${new Date().toISOString()}] Catch Error: ${err.message}\n`);
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate, authorize, authorizeOwnerOrAdmin, supabase };
