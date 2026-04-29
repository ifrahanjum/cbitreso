# reso — my Security todolist

### Section 1: Environment Variables & Secret Management

- [ ] **1.1** — Hardcoded secrets: API keys, tokens, passwords in source. Grep for: `sk_live_`, `sk_test_`, `Bearer`, `eyJ`, `AKIA`, 32+ char strings in quotes
- [ ] **1.2** — .gitignore coverage: `.env`, `.env.local`, `.env.production` all listed. Check git history for committed .env files
- [ ] **1.3** — Public prefix leaks: `VITE_` prefix only on safe-to-expose keys. `SUPABASE_SERVICE_ROLE_KEY` must NEVER use `VITE_` prefix
- [ ] **1.4** — Console/error leaks: `console.log`/`console.error` printing env vars or secrets to browser
- [ ] **1.5** — Build artifact exposure: Source maps disabled in production (Vite `sourcemap` config)
- [ ] **1.6** — Startup validation: App fails fast if required env vars are missing

### Section 2: Database Security (Supabase PostgreSQL)

- [ ] **2.1** — RLS enabled on ALL tables: `users`, `resources`, `departments`, `subjects`
- [ ] **2.2** — RLS policies exist: Every RLS-enabled table has SELECT, INSERT, UPDATE policies
- [ ] **2.3** — WITH CHECK clauses: INSERT/UPDATE policies include WITH CHECK to prevent user_id spoofing
- [ ] **2.4** — Policy identity source: Uses `auth.uid()`, NOT `auth.jwt()->'user_metadata'`
- [ ] **2.5** — Service role key isolation: `SUPABASE_SERVICE_ROLE_KEY` only in backend server code, never in Vue components
- [ ] **2.6** — Storage bucket policies: `resources` bucket has RLS preventing unauthorized uploads/reads
- [ ] **2.7** — SQL injection: No raw SQL with string concatenation. Check `.rpc()` calls
- [ ] **2.8** — SECURITY DEFINER functions: Any DB functions checked for data exposure

### Section 3: Authentication & Session Management

- [ ] **3.1** — Auth middleware on all protected routes (`POST /resources`, `PUT`, `DELETE`, `/users/me/*`)
- [ ] **3.2** — Default-deny routing: New routes automatically require auth (allowlist public routes)
- [ ] **3.3** — `getUser()` vs `getSession()`: Security-sensitive ops use `supabase.auth.getUser()` with server-side JWT validation
- [ ] **3.4** — Auth callback handles errors, doesn't expose tokens in URLs/logs
- [ ] **3.5** — Session stored in httpOnly cookies, not localStorage
- [ ] **3.6** — Every API route handling user data checks auth before processing
- [ ] **3.7** — Email domain restriction enforced server-side, not just frontend
- [ ] **3.8** — Password reset tokens expire and are single-use

### Section 4: Server-Side Validation

- [ ] **4.1** — Zod schemas validate all API input server-side (not just Vue form validation)
- [ ] **4.2** — User identity from JWT `req.user.id`, never from request body `{ userId }`
- [ ] **4.3** — Resource titles/descriptions sanitized to prevent XSS
- [ ] **4.4** — State-changing ops use POST/PUT/DELETE, not GET
- [ ] **4.5** — Error responses don't leak stack traces, SQL errors, or file paths
- [ ] **4.6** — File MIME type validated server-side (not just extension check)

### Section 5: Dependency Security

- [ ] **5.1** — `npm audit` clean or all findings addressed
- [ ] **5.2** — No hallucinated packages (low download counts, suspicious names)
- [ ] **5.3** — Lockfile committed (`package-lock.json`)
- [ ] **5.4** — No outdated packages with known CVEs
- [ ] **5.5** — No unused dependencies

### Section 6: Rate Limiting

- [ ] **6.1** — Upload endpoint rate-limited (prevents storage abuse)
- [ ] **6.2** — Auth endpoints rate-limited (brute force protection)
- [ ] **6.3** — Rate limiting is server-side with persistent store (Redis), not in-memory

### Section 7: CORS

- [ ] **7.1** — CORS restricts to app's own domain(s), no `*` on protected endpoints
- [ ] **7.2** — `Access-Control-Allow-Credentials` only with specific origins

### Section 8: File Upload Security

- [ ] **8.1** — File type + size validated server-side (MIME type, not just extension)
- [ ] **8.2** — Uploaded files stored with RLS policies (private bucket, signed URLs)
- [ ] **8.3** — Uploaded files cannot be executed on the server
- [ ] **8.4** — File hash computed server-side (cannot be spoofed by client)

---

## Part 2: Reso-Specific Security Testing

### Resource Upload Attack Vectors

| Attack | What to Test | Expected Behavior |
|--------|-------------|-------------------|
| Oversized file | Upload 50MB file | Rejected at 25MB with `413 FILE_TOO_LARGE` |
| Malicious MIME | Rename `.exe` to `.pdf` | Server rejects based on actual MIME type |
| Path traversal in filename | `../../etc/passwd.pdf` | Filename sanitized, stored with UUID path |
| XSS in title | `<script>alert(1)</script>` | Sanitized before storage and rendering |
| SQL injection in search | `'; DROP TABLE resources; --` | Parameterized query, no effect |
| Anonymous upload abuse | 10 anonymous uploads in 1 hour | Blocked after 5 with `429 RATE_LIMITED` |

### Permission Escalation Tests

| Attack | What to Test | Expected Behavior |
|--------|-------------|-------------------|
| Delete other's upload | `DELETE /resources/:id` with different user's token | `403 FORBIDDEN` |
| Edit other's upload | `PUT /resources/:id` with different user's token | `403 FORBIDDEN` |
| Override duplicate as student | `POST /resources/:id/duplicate-override` | `403 FORBIDDEN` |
| Access admin analytics | `GET /admin/analytics` as student | `403 FORBIDDEN` |
| Forge role in JWT | Modify JWT payload to `role: "admin"` | JWT signature validation fails → `401` |

### Supabase-Specific Tests

| Test | What to Verify |
|------|---------------|
| Anon key direct DB access | Query `resources` table directly with anon key — should only see `status = 'active'` rows |
| Service role key exposure | Search entire frontend codebase for `SUPABASE_SERVICE_ROLE_KEY` — must be zero results |
| Storage direct access | Try accessing `/storage/v1/object/public/resources/...` — should be denied (private bucket) |
| RLS bypass via `.rpc()` | Any Supabase RPC functions must not be `SECURITY DEFINER` without explicit need |


