# reso — API Specification

> REST API contract for the CBIT Academic Resource Hub. Definitive reference between the Vue 3 frontend and Node.js/Express backend.

---

## Base Configuration

```
Production:  https://api.reso.cbit.ac.in/v1
Development: http://localhost:3001/v1
```

**Auth:** Bearer token via `Authorization: Bearer <jwt>` header on protected routes.

---

## 1. Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | No | Register (CBIT email only) |
| `POST` | `/auth/login` | No | Login → JWT access + refresh token |
| `POST` | `/auth/logout` | Yes | Invalidate session |
| `POST` | `/auth/refresh` | No | Refresh expired access token |
| `GET` | `/auth/profile` | Yes | Get user profile + stats |

### Register — `POST /auth/register`

```json
// Request
{ "name": "Ifrah Anjum", "email": "ifrah@cbit.ac.in", "password": "SecureP@ss123" }

// Response 201
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Ifrah Anjum", "email": "ifrah@cbit.ac.in", "role": "student" },
    "session": { "access_token": "eyJ...", "refresh_token": "abc...", "expires_at": 1714060800 }
  }
}
```

**Validation:** Email must end with `@cbit.ac.in` or `@cbit.org.in`. Password: min 8 chars, ≥1 uppercase, ≥1 number.

### Login — `POST /auth/login`

```json
// Request
{ "email": "ifrah@cbit.ac.in", "password": "SecureP@ss123" }

// Response 200 — same shape as register response
```

**Errors:** `401 INVALID_CREDENTIALS`, `429 RATE_LIMITED` (10 req / 15 min)

---

## 2. Resources

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/resources` | No | List with filters + pagination + search |
| `GET` | `/resources/:id` | No | Single resource with download URL |
| `POST` | `/resources` | Yes | Upload file + metadata |
| `PUT` | `/resources/:id` | Yes | Update metadata (owner/admin) |
| `DELETE` | `/resources/:id` | Yes | Soft-delete (owner/admin) |
| `GET` | `/resources/:id/download` | No | Generate signed download URL |

### List — `GET /resources`

**Query params:** `department`, `semester`, `regulation`, `resource_type`, `subject_id`, `search`, `page` (default 1), `per_page` (default 20, max 50), `sort` (created_at|title|download_count), `order` (asc|desc)

```json
// Response 200
{
  "success": true,
  "data": [{
    "id": "uuid", "title": "DS Unit 1 Notes", "resource_type": "notes",
    "file_name": "DS_Unit1.pdf", "file_size": 2457600, "download_count": 87,
    "is_duplicate_flagged": false, "created_at": "2026-04-20T14:30:00Z",
    "subject": { "id": 15, "name": "Data Structures", "code": "CS301", "semester": 3, "regulation": "R22" },
    "department": { "code": "CSE", "name": "Computer Science & Engineering" },
    "uploaded_by": { "id": "uuid", "name": "Ifrah Anjum" }
  }],
  "meta": { "page": 1, "per_page": 20, "total": 142, "total_pages": 8 }
}
```

### Upload — `POST /resources`

**Content-Type:** `multipart/form-data`

| Field | Required | Constraints |
|-------|----------|-------------|
| `file` | Yes | Max 25MB. `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx` |
| `title` | Yes | 5–300 chars |
| `description` | No | Max 2000 chars |
| `subject_id` | Yes | Must exist in subjects table |
| `resource_type` | Yes | Valid enum value |
| `is_anonymous` | No | Default false |

**Upload flow:** Validate → SHA-256 hash → Store in Supabase Storage → Create record (`status=processing`) → Async duplicate check → Set `status=active`

### Delete — `DELETE /resources/:id`

Permission: `uploaded_by === req.user.id` OR `req.user.role === 'admin'`. Otherwise → `403 FORBIDDEN`.

---

## 3. Taxonomy

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/departments` | All active departments |
| `GET` | `/departments/:code/subjects?semester=3&regulation=R22` | Subjects for dept |
| `GET` | `/regulations` | All regulation codes |
| `GET` | `/resource-types` | All resource type enum values |

---

## 4. User

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/me/uploads` | Yes | Paginated upload history |
| `GET` | `/users/me/stats` | Yes | Upload count, downloads received |

---

## 5. Duplicates

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/resources/:id/duplicates` | No | Duplicate info + similarity score |
| `POST` | `/resources/:id/duplicate-override` | Admin | Override flag with justification |

---

## 6. Error Codes

| HTTP | Code | When |
|------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid input |
| 400 | `INVALID_FILE_TYPE` | Bad MIME type |
| 401 | `UNAUTHORIZED` | Missing/invalid JWT |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `DUPLICATE_DETECTED` | Hash match (informational) |
| 413 | `FILE_TOO_LARGE` | >25MB |
| 429 | `RATE_LIMITED` | Includes `Retry-After` header |
| 500 | `INTERNAL_ERROR` | Never exposes stack traces |

**Error shape:**
```json
{ "success": false, "error": "VALIDATION_ERROR", "message": "...", "details": {} }
```

## 7. Rate Limits

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| Auth (login/register) | 10 | 15 min | IP |
| Upload (authenticated) | 20 | 1 hour | User ID |
| Upload (anonymous) | 5 | 24 hours | Session |
| Browse/search | 60 | 1 min | IP |
| Download | 30 | 1 min | IP |