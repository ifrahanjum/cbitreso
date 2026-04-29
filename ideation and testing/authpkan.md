# auth

## 1. Auth Model Analysis

### why non std

This is **not** conventional email/password auth. The credentials are **deterministic** — both the username and password can be derived from institutional data:

| Role | Identifier | Password | Example |
|---|---|---|---|
| **Student** | Roll number `160123733050` | Department name derived from embedded code (`733` → `cse`) | ID: `160123733050`, PW: `cse` |
| **Faculty** | Email `rajesh_cse@cbit.ac.in` | Department extracted from email (`cse`) | ID: `rajesh_cse@cbit.ac.in`, PW: `cse` |

The password is **not secret** — anyone who knows the roll number format can derive it. This is intentionally a **low-friction access gate** ("prove you know your department"), not a security-hardened auth system.

### Roll number anatomy

```
1 6 0 1 | 2 3 | 7 3 3 | 0 5 0
└──────┘ └──┘ └─────┘ └─────┘
 College  Year   Dept   Student
 prefix  (2023)  code   number
```

Format: `1601` + last 2 digits of admission year + 3-digit dept code + 3-digit student number = **12 digits total**.
Dept code occupies positions **6–8** (zero-indexed).

### department code mapping

| Code | Department | Short |
|---|---|---|
| `732` | Civil Engineering | CIV |
| `733` | Computer Science and Engineering | CSE |
| `734` | Electrical and Electronics Engineering | EEE |
| `735` | Electronics and Communications Engineering | ECE |
| `736` | Mechanical Engineering | MEC |
| `737` | Information Technology | IT |
| `729` | Artificial Intelligence and Machine Learning (independent) | AIML |
| `748` | Computer Science and Engineering (AI&ML) | CSE-AIML |
| `749` | Computer Engineering and Technology (IoT & Cyber Security) | CET |
| `771` | Artificial Intelligence and Data Science | AIDS |
| `802` | Chemical Engineering | CHEM |
| `805` | Biotechnology | BIO |

---

## 2. Firebase vs Supabase 

### Comparison matrix for THIS use case

| Criteria | Supabase Auth | Firebase Auth | Winner |
|---|---|---|---|
| **Already in stack** |  Backend uses `@supabase/supabase-js` |  Not installed, no project created | Supabase |
| **Schema compatibility** |  `users.id` references `auth.users(id)` |  Would need schema rewrite | Supabase |
| **RLS policies** |  Already written (`auth.uid()`) |  Different paradigm (Firestore rules) | Supabase |
| **Custom validation** |  Server-side validate → then `signUp` |  Custom tokens via Admin SDK | Tie |
| **Non-email identifiers** |  Needs synthetic email workaround |  Same — Custom Auth requires server | Tie |
| **Client SDK maturity** | Good (`@supabase/supabase-js`) | Excellent (Firebase JS SDK) | Firebase |
| **Free tier** | 50K MAU | 10K SMS verifications, unlimited email | Tie |
| **Session management** | JWT auto-refresh, `onAuthStateChange` | Persistent sessions, `onAuthStateChanged` | Tie |
| **Migration cost** | Zero — already configured | High — new project, new SDK, schema changes | Supabase |

### Verdict: **Supabase** 

The deciding factors:
1. **Zero migration cost** — Supabase is already configured in the backend with env vars, client instance, and a schema that directly references `auth.users(id)`.
2. **RLS policies already written** — `auth.uid()` is used in existing policies. Switching to Firebase would break these and require a completely different authorization model.
3. **The custom validation logic lives on the server regardless** — Both services need the backend to validate roll-number-to-department mapping before creating/authenticating the user. Neither has a native "roll number auth" feature.

---

## 3. Architecture

### Auth flow

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────┐
│   Frontend   │     │  Backend (Express) │     │   Supabase   │
│  LoginView   │     │  POST /auth/login  │     │   Auth API   │
└──────┬───────┘     └────────┬──────────┘     └──────┬───────┘
       │                      │                       │
       │  1. {rollNo, pwd}    │                       │
       │─────────────────────>│                       │
       │                      │                       │
       │  2. Validate:        │                       │
       │     extract dept     │                       │
       │     from rollNo,     │                       │
       │     compare to pwd   │                       │
       │                      │                       │
       │                      │  3. signUp/signIn     │
       │                      │  (synthetic email)    │
       │                      │──────────────────────>│
       │                      │                       │
       │                      │  4. {session, user}   │
       │                      │<──────────────────────│
       │                      │                       │
       │  5. {token, user}    │                       │
       │<─────────────────────│                       │
       │                      │                       │
       │  6. Store session,   │                       │
       │     redirect to /    │                       │
```

### Synthetic email strategy

Students don't have institutional emails. Supabase Auth requires an email identifier. Solution: **generate a deterministic synthetic email** from the roll number:

```
160123733050  →  160123733050@student.reso.cbit
rajesh_cse@cbit.ac.in  →  used as-is
```

This synthetic email:
- Is deterministic (same roll number always produces the same email)
- Never receives actual mail (no verification needed — we disable email confirmation)
- Serves purely as a unique key in `auth.users`

---

## 4. ideas

### Step 1: Backend — Auth validation module

**File:** `backend/auth.js` (new)

```js
const DEPT_CODES = {
  '732': 'civ',
  '733': 'cse',
  '734': 'eee',
  '735': 'ece',
  '736': 'mec',
  '737': 'it',
  '729': 'aiml',
  '748': 'cse-aiml',
  '749': 'cet',
  '771': 'aids',
  '802': 'chem',
  '805': 'bio',
};

function validateStudent(rollNo, password) {
  // Format: 1601YY[dept_code]XXX  (12 digits)
  if (!/^1601\d{8}$/.test(rollNo))
    return { valid: false, error: 'Invalid roll number format (expected 1601YYDDDNNN)' };

  const deptCode = rollNo.substring(6, 9);
  const expectedDept = DEPT_CODES[deptCode];

  if (!expectedDept)
    return { valid: false, error: 'Unrecognized department code in roll number' };

  if (password.toLowerCase() !== expectedDept)
    return { valid: false, error: 'Incorrect department password' };

  return {
    valid: true,
    syntheticEmail: `${rollNo}@student.reso.cbit`,
    dept: expectedDept.toUpperCase(),
    role: 'student'
  };
}

function validateFaculty(email, password) {
  // Relaxed format: anything_dept@cbit.ac.in (allows dots, initials, numbers in name)
  const match = email.toLowerCase().match(/^(.+)_([a-z\-]+)@cbit\.ac\.in$/);
  if (!match)
    return { valid: false, error: 'Email must be in format name_dept@cbit.ac.in' };

  const [, name, dept] = match;

  if (password.toLowerCase() !== dept)
    return { valid: false, error: 'Incorrect department password' };

  return {
    valid: true,
    email: email.toLowerCase(),
    dept: dept.toUpperCase(),
    role: 'faculty',
    name
  };
}

module.exports = { validateStudent, validateFaculty, DEPT_CODES };
```

### Step 2: Backend — Auth routes in `index.js`

```
POST /auth/login
  Body: { type: 'student'|'faculty', identifier, password }

  1. Validate with validateStudent() or validateFaculty()
  2. Try supabase.auth.signInWithPassword(email, password)
  3. If user not found → supabase.auth.admin.createUser() → then sign in
  4. Upsert into public.users (roll/email, dept, role)
  5. Return { session, user }

POST /auth/logout
  Body: { accessToken }
  → supabase.auth.admin.signOut(...)

GET /auth/me
  Header: Authorization: Bearer <token>
  → Decode JWT, return user profile from public.users
```

### Step 3: Frontend — Auth store

**File:** `frontend/src/store/auth.js` (new Pinia store)

```
State:  user, session, isAuthenticated, isLoading, error
Actions: login(type, identifier, password), logout(), checkSession()
```

- Calls backend API (not Supabase directly)
- Stores session in `localStorage`
- On app mount: `checkSession()` restores from localStorage

### Step 4: Wire LoginView

**File:** `frontend/src/views/LoginView.vue` (modify)

- Import `useAuthStore`
- On submit: `authStore.login(loginType, identifier, password)`
- Loading spinner on AUTHENTICATE button
- Inline error messages below form
- On success: redirect to `/` or saved redirect path

### Step 5: Route guards

**File:** `frontend/src/router/index.js` (modify)

Protected routes: `upload` only. All browse/explore/papers/syllabus remain **public** — the value of Reso is discoverability; gating content behind login would hurt adoption. Auth is only required to *contribute* (upload), not to *consume*.

```js
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.name === 'upload' && !auth.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});
```

### Step 6: Schema update

```sql
ALTER TABLE users ADD COLUMN roll_no VARCHAR(12);
ALTER TABLE users ADD COLUMN department_code VARCHAR(10);
ALTER TABLE users ADD COLUMN identifier_type VARCHAR(10)
  CHECK (identifier_type IN ('student', 'faculty'));
```

### Supabase project config

- **Disable email confirmation** (Settings → Auth → Email confirmations OFF)
- Set JWT expiry to **7 days**

---

## 5. File changes summary

| File | Action | Description |
|---|---|---|
| `backend/auth.js` | **Create** | Validation functions + confirmed dept code mapping |
| `backend/index.js` | **Modify** | Add `/auth/login`, `/auth/logout`, `/auth/me` routes |
| `backend/schema.sql` | **Modify** | Add `roll_no`, `department_code`, `identifier_type` to `users` |
| `frontend/src/store/auth.js` | **Create** | Pinia auth store (user, session, login/logout actions) |
| `frontend/src/views/LoginView.vue` | **Modify** | Wire forms to auth store, add error/loading states |
| `frontend/src/router/index.js` | **Modify** | Add `beforeEach` guard for `/upload` |
| `frontend/src/App.vue` (or layout) | **Modify** | Call `authStore.checkSession()` on mount, show user info in header |

---

## 6. Risks & edge cases

| Risk | Mitigation |
|---|---|
| Synthetic emails collide with real emails | `@student.reso.cbit` is not a real domain — no collision possible |
| Dept code mapping changes in future | Store mapping in DB table instead of hardcoding; seed from `DEPT_CODES` initially |
| Password is trivially guessable | Accepted tradeoff — access gate, not security boundary |
| Admission year varies (e.g. `160125` for 2025) | Regex validates `1601` prefix + any 2-digit year; dept code always at index 6–8 |
| Faculty email variations (`r.kumar_cse`, `rajesh123_cse`) | Relaxed regex: `.+_[a-z\-]+@cbit\.ac\.in` handles dots, numbers, initials |
| Session expiry UX | Auto-redirect to `/login` with toast "Session expired" |

---

## 7. UAT criteria-done

- [ ] Student logs in with valid roll number + correct department
- [ ] Student sees error with wrong department password
- [ ] Student sees error with malformed roll number (< 12 digits, wrong prefix)
- [ ] Faculty logs in with `name_dept@cbit.ac.in` + correct dept
- [ ] Faculty with variations (`r.k_cse@cbit.ac.in`) can log in
- [ ] Faculty sees error with non-CBIT email domain
- [ ] Logged-in user can access `/upload`
- [ ] Anonymous user redirected to `/login` when visiting `/upload`
- [ ] Session persists across page refresh
- [ ] Logout clears session and redirects to `/`
- [ ] Header shows user info (roll number or name) when authenticated
