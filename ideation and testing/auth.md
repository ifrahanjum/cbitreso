# reso — Authentication & Security Implementation Guide

> Production-ready auth and security layer for the CBIT Academic Resource Hub. Maps directly to the API contract in `api.md`.

---

## System Context

**Backend:** Node.js/Express with Supabase Auth, Supabase PostgreSQL (with RLS), Supabase Storage. **Frontend:** Vue 3 + Vite. **Roles:** `student`, `faculty`, `admin`.

---

## 1. Supabase Auth — Login Flow

### Sequence

```
Student → Vue Frontend → Supabase Auth SDK → JWT issued
                                                  ↓
                             Express Backend ← Bearer token in header
                                  ↓
                         JWT verified → Custom claims hydrated → req.user set
                                  ↓
                         Route handler executes with authenticated context
```

### Implementation

1. **Frontend:** Call `supabase.auth.signInWithPassword({ email, password })`
2. **Supabase** issues JWT with standard claims (`sub`, `email`, `role`, `exp`)
3. **Frontend** stores tokens via Supabase SDK (httpOnly cookie preferred, localStorage fallback)
4. **Every API request** includes `Authorization: Bearer <access_token>`
5. **Express middleware** validates JWT signature using `SUPABASE_JWT_SECRET`
6. **Claims hydration** middleware fetches user record from `users` table to populate `req.user`

### Email Domain Restriction

Registration endpoint validates email against allowed domains before calling Supabase Auth:
```javascript
const ALLOWED_DOMAINS = ['cbit.ac.in', 'cbit.org.in'];
const domain = email.split('@')[1];
if (!ALLOWED_DOMAINS.includes(domain)) {
  return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Only CBIT email addresses are allowed' });
}
```

---

## 2. JWT Middleware Stack

Middleware executes in this order on every protected route:

### Layer 1 — Token Extraction
```javascript
// Extract Bearer token from Authorization header
// Reject: missing header → 401, malformed format → 401
```

### Layer 2 — JWT Verification
```javascript
// Verify signature against SUPABASE_JWT_SECRET
// Check expiry (exp claim)
// Reject: invalid signature → 401, expired → 401
```

### Layer 3 — Claims Hydration
```javascript
// Fetch user record from users table using JWT sub (user ID)
// Attach to req.user: { id, name, email, role, created_at }
// Reject: user not found in DB → 401 (account deleted/deactivated)
```

### Layer 4 — RBAC Enforcement (per-route)
```javascript
// authorize(['admin']) — middleware factory
// Checks req.user.role against allowed roles
// Reject: insufficient role → 403
```

### Which middleware applies where:

| Middleware | Scope |
|-----------|-------|
| Token extraction + JWT verification + Claims hydration | All `/auth/profile`, `/resources` POST/PUT/DELETE, `/users/me/*` |
| RBAC `authorize(['admin'])` | `POST /resources/:id/duplicate-override`, admin analytics |
| None (public) | `GET /resources`, `GET /departments`, `GET /regulations`, auth login/register |

---

## 3. RBAC Permission Matrix

| Capability | student | faculty | admin |
|------------|:-------:|:-------:|:-----:|
| Browse & search resources | ✅ | ✅ | ✅ |
| View resource detail | ✅ | ✅ | ✅ |
| Download resource | ✅ | ✅ | ✅ |
| Upload resource | ✅ | ✅ | ✅ |
| Upload anonymously | ✅ | ✅ | ❌ |
| Edit own upload metadata | ✅ | ✅ | ✅ |
| Delete own upload | ✅ | ✅ | ✅ |
| Delete any upload | ❌ | ❌ | ✅ |
| Override duplicate flags | ❌ | ❌ | ✅ |
| View user upload stats | own | own | any |
| Manage departments/subjects | ❌ | ❌ | ✅ |

### `authorize()` Middleware Factory

```javascript
function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage:
router.post('/resources/:id/duplicate-override', authenticate, authorize(['admin']), handler);
```

### Resource Ownership Check

```javascript
function authorizeOwnerOrAdmin(req, res, next) {
  const resource = req.resource; // loaded by param middleware
  if (resource.uploaded_by === req.user.id || req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'You can only modify your own uploads' });
}
```

---

## 4. Rate Limiting

Using `express-rate-limit` with Redis store for persistence across deployments.

| Endpoint | Window | Max | Key | On Breach |
|----------|--------|-----|-----|-----------|
| `/auth/login`, `/auth/register` | 15 min | 10 | IP | 429 + `Retry-After` |
| `POST /resources` (authenticated) | 1 hour | 20 | User ID | 429 |
| `POST /resources` (anonymous) | 24 hours | 5 | Session token | 429 |
| `GET /resources`, search | 1 min | 60 | IP | 429 |
| `GET /resources/:id/download` | 1 min | 30 | IP | 429 |

---

## 5. CORS Configuration

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://reso.cbit.ac.in']
    : ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // preflight cache: 24 hours
};
```

---

## 6. Row-Level Security (RLS)

### `resources` table policies

```sql
-- Anyone can read active resources
CREATE POLICY "Public read" ON resources FOR SELECT USING (status = 'active');

-- Authenticated users can insert
CREATE POLICY "Auth insert" ON resources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Owner can update own resources
CREATE POLICY "Owner update" ON resources FOR UPDATE USING (uploaded_by = auth.uid());

-- Owner can soft-delete own resources
CREATE POLICY "Owner delete" ON resources FOR UPDATE USING (uploaded_by = auth.uid())
  WITH CHECK (status = 'deleted');
```

### `users` table policies

```sql
-- Users can read own profile
CREATE POLICY "Self read" ON users FOR SELECT USING (id = auth.uid());

-- Users can update own profile
CREATE POLICY "Self update" ON users FOR UPDATE USING (id = auth.uid());
```

### Storage bucket policies

```sql
-- Authenticated users can upload to resources bucket
CREATE POLICY "Auth upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resources' AND auth.uid() IS NOT NULL);

-- Anyone can read (download requires signed URL from API)
CREATE POLICY "Public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'resources');
```

---

## 7. Token Lifecycle

| Event | Behavior |
|-------|----------|
| Login | Supabase issues access token (1hr) + refresh token (30 days) |
| Token expiry | Frontend calls `/auth/refresh` with refresh token |
| Refresh | Server validates refresh token, re-fetches user from DB, issues new access token |
| Logout | Refresh token revoked server-side |
| Account deactivation | Claims hydration middleware returns 401 (user not found in DB) |

### Frontend: Silent Refresh

```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    // Update stored token
  }
  if (event === 'SIGNED_OUT') {
    // Redirect to login
  }
});
```

---

## 8. Input Validation

Server-side Zod schemas on all API routes:

```javascript
const uploadSchema = z.object({
  title: z.string().min(5).max(300),
  description: z.string().max(2000).optional(),
  subject_id: z.number().int().positive(),
  resource_type: z.enum(['notes', 'question_paper', 'question_bank', 'course_pack', 'important_questions', 'calendar']),
  is_anonymous: z.boolean().optional().default(false)
});
```

**File validation (server-side):**
- Check MIME type (not just extension)
- Max size: 25MB
- Allowed: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`

---

## 9. Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Backend `.env` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend `.env` | **Server-only** — bypasses RLS |
| `SUPABASE_JWT_SECRET` | Backend `.env` | JWT signature verification |
| `PORT` | Backend `.env` | Express server port |
| `CORS_ORIGIN` | Backend `.env` | Allowed frontend origin |
| `REDIS_URL` | Backend `.env` | Rate limiter backing store |
| `VITE_SUPABASE_URL` | Frontend `.env.local` | Supabase URL (public) |
| `VITE_SUPABASE_ANON_KEY` | Frontend `.env.local` | Anon key (public, RLS-protected) |
| `VITE_API_BASE_URL` | Frontend `.env.local` | Backend API URL |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` must **never** be prefixed with `VITE_` or exposed to the frontend.

---

## 10. Security Logging

**Log:**
- Failed auth attempts (IP, email, timestamp)
- Rate limit breaches (IP, endpoint, timestamp)
- Permission denials (user ID, attempted action, resource ID)
- Duplicate flag overrides (admin ID, resource ID, justification)

**Never log:**
- Raw JWT tokens
- Passwords or password hashes
- Service role keys
- Full file contents
