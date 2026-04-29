# RESO — Academic Resource Hub

RESO (Resource) is a high-performance, decentralized academic repository designed for the Chaitanya Bharathi Institute of Technology (CBIT). It streamlines access to notes, question papers, and academic schedules through a modern, synchronized user experience.

---

## 🌍 Vision & Purpose
The platform was built to solve the fragmentation of academic materials. By providing a "Single Source of Truth" that automatically syncs with a student's department and semester, RESO reduces discovery time from minutes to seconds.

---

## Modern Technology Stack

**At a Glance:** `Vue.js 3` `Vite` `Pinia` `Tailwind CSS` `Node.js` `Express.js` `PostgreSQL` `Supabase`

To ensure the platform is incredibly fast, secure, and easy to maintain, RESO was built using a modern tech stack. Here is a comprehensive breakdown of the tools used:

### Frontend (The User Interface)
*   **Vue.js 3 (Composition API) & Vite:** The core framework used to build the website. Vue allows for a "Single Page Application" experience, making navigation instantaneous.
*   **Pinia (State Management):** Manages the global state of the application, including the user's department, semester, and active resource filters.
*   **GSAP (GreenSock):** Powers the high-end animations and smooth transitions across the platform.
*   **OGL (WebGL):** Used for the interactive, dynamic background grids (e.g., DotGrid) that provide a premium feel.
*   **Tailwind CSS:** A utility-first CSS framework that ensures a consistent, responsive, and professional UI.
*   **Lucide Icons:** Crisp, scalable iconography for a modern look.

### Backend & Infrastructure (The Server & Database)
*   **Supabase (PostgreSQL Database):** A robust relational database for curriculum mapping and resource indexing.
*   **Supabase Storage:** Securely hosts PDF files with protected public buckets.
*   **Supabase Auth:** Handles secure student/faculty login and session management.
*   **Node.js & Express.js:** The core API layer handling business logic, file processing, and security middleware.

### 🛡️ Enterprise-Grade Security
RESO implements a multi-layer security architecture to protect student data and platform integrity:
*   **Row Level Security (RLS)**: Enforced at the database level. Users can only modify resources they personally uploaded.
*   **Role-Based Access (RBAC)**: Students, Faculty, and Admins have distinct permission tiers.
*   **Content Hashing**: Uses SHA-256 to flag duplicate uploads and ensure file integrity.
*   **Rate Limiting**: Intelligent throttling to prevent DDoS and automated scraping.

### 📈 Modern Roadmap
1.  **Phase 1 (Complete):** Core architecture, Curriculum syncing, Reader View, and Search.
2.  **Phase 2 (Complete):** Secure Auth, Resource Upload, and Ownership Management (RLS).
3.  **Phase 3 (Upcoming):** AI-Powered Summaries, Community Ratings, and Dark Mode optimization.

---

## 🎯 Key Features
*   **Smart Sync:** Automatically detects your department/semester and filters the entire app to match.
*   **Global Search:** Ultra-fast, full-text search across all subject titles and descriptions.
*   **Paper Archive:** Dedicated portal for mid-term and semester-end question papers.
*   **Mobile Optimized:** A first-class experience on any device, from laptops to smartphones.
*   **Secure Contribution:** Students and Faculty can upload materials with automatic deduplication.

---

## 🚀 Deployment & Scaling
RESO is designed for horizontal scaling. The separation of the frontend (Vite) and backend (Express) allows each to be deployed independently (e.g., Vercel + Railway/Render), while Supabase handles the heavy lifting of database management and file storage.

> A centralized platform where CBIT students and faculty upload, organize, and search academic resources — consolidating scattered educational materials into one searchable, community-driven hub.

---

## Problem Context

CBIT students currently navigate **five disconnected sources** to find academic materials:

| Resource | Current Source | Pain Point |
|----------|---------------|------------|
| Notes | [CloudFront CDN](https://d2n36fr2627nzy.cloudfront.net/#) | No search, no filtering, no metadata |
| Question Papers | [SPDC Portal](https://spdc.cbit.org.in/course/view.php?id=227) | Requires Moodle login, buried navigation |
| Syllabi | [CBIT Website](https://www.cbit.ac.in/current_students/ug-and-pg-syllabus-structure/) | Static pages, no cross-reference to resources |
| Exam Schedules | [CBIT Calendars](https://www.cbit.ac.in/current_students/acedamic-calendar/) | Separate page from timetables |
| Student Materials | [Google Drive](https://drive.google.com/drive/folders/1rleirLGXwVKWsoIb2kIhA66_184LVyQI?usp=sharing) | Unstructured, no moderation, no discoverability |

**reso** solves this by providing a single platform where students and faculty upload, organize, and discover resources — while integrating (not duplicating) existing official CBIT links.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  Vue 3 + Vite + Tailwind CSS                                    │
│  ┌──────────┬──────────┬──────────┬──────────┬────────────────┐ │
│  │  Login   │  Browse  │  Upload  │  My      │  Official      │ │
│  │  Register│  Search  │  Resource│  Uploads │  Links         │ │
│  └──────────┴──────────┴──────────┴──────────┴────────────────┘ │
│                    Vue Router + Pinia State                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API (HTTPS)
┌─────────────────────────┴───────────────────────────────────────┐
│                         BACKEND                                  │
│  Node.js + Express                                               │
│  ┌──────────┬──────────┬──────────┬──────────┬────────────────┐ │
│  │  Auth    │  Resource│  Upload  │  Search  │  Duplicate     │ │
│  │  Routes  │  CRUD    │  Handler │  & Filter│  Detection     │ │
│  └──────────┴──────────┴──────────┴──────────┴────────────────┘ │
│                    Middleware: JWT + RBAC + Rate Limit            │
└────────┬────────────────┬────────────────┬──────────────────────┘
         │                │                │
┌────────┴──────┐  ┌──────┴──────┐  ┌─────┴───────┐
│  Supabase     │  │  Supabase   │  │  Supabase   │
│  Auth         │  │  PostgreSQL │  │  Storage    │
│  (JWT/Email)  │  │  (RLS)      │  │  (Files)    │
└───────────────┘  └─────────────┘  └─────────────┘
```

---

## Tech Stack — Final Decision

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | Vue 3 (Composition API) + Vite | Lightweight, fast HMR, excellent DX for a small team |
| **Routing** | Vue Router 4 | Standard Vue routing with lazy-loaded views |
| **State** | Pinia | Official Vue state management, simpler than Vuex |
| **Styling** | Tailwind CSS v3 | Utility-first CSS, consistent design tokens, rapid prototyping |
| **Backend** | Node.js + Express | Flexible, mature middleware ecosystem, easy Supabase SDK integration |
| **Database** | Supabase (PostgreSQL) | RLS for row-level security, real-time subscriptions, built-in REST API as fallback, structured relational data fits hierarchical resource taxonomy |
| **Auth** | Supabase Auth | Email/password + magic link, JWT with custom claims, free tier handles college-scale auth |
| **File Storage** | Supabase Storage | Integrated with auth (RLS on buckets), free tier: 1GB storage / 2GB bandwidth, scales with paid plan |
| **Deployment** | Vercel (frontend) + Render/Railway (backend) | Free tier for MVP, automatic deploys from Git |

### Why Supabase over MongoDB?

The hierarchical taxonomy (Department → Semester → Subject → Resource Type → Regulation) maps cleanly to relational foreign keys and JOIN queries. PostgreSQL's full-text search (`tsvector`) eliminates the need for a separate search service. RLS enforces "users can only delete their own uploads" at the database level — not just in application code. Supabase Storage is co-located with the database, simplifying file ↔ metadata consistency.

---

## Resource Organization

### Hierarchical Taxonomy

```
Department (CSE, ECE, EEE, ME, ...)
  └── Semester (1–8)
       └── Subject (Data Structures, DBMS, ...)
            └── Resource Type
                 ├── Notes
                 ├── Old Question Papers
                 ├── Question Banks
                 ├── Course Packs
                 ├── Important Questions
                 └── Academic Calendars / Exam Schedules
```

### Regulation Support

- Multiple syllabus regulations coexist: **R22**, **R22A**, and future revisions
- Resources are **tagged** with their applicable regulation, not siloed
- Default browse view shows **all regulations mixed** — students filter by their own
- Filter UI: regulation is a dropdown/chip filter, not a separate navigation layer

---

## User Roles & Permissions

| Capability | Student | Faculty | Admin |
|------------|:-------:|:-------:|:-----:|
| Browse & search resources | ✅ | ✅ | ✅ |
| Upload resources (with metadata) | ✅ | ✅ | ✅ |
| Upload anonymously | ✅ | ✅ | — |
| Edit own upload metadata | ✅ | ✅ | ✅ |
| Delete own uploads | ✅ | ✅ | ✅ |
| Delete any upload | — | — | ✅ |
| View "My Uploads" dashboard | ✅ | ✅ | ✅ |
| View admin analytics | — | — | ✅ |
| Override duplicate flags | — | — | ✅ |

### Anonymous Uploads

- Any logged-in user can choose "Upload Anonymously" — the upload is stored with `uploaded_by = NULL` and a session-based `anonymous_token` for rate-limiting
- Anonymous uploads appear immediately but cannot be edited or deleted by the uploader after submission
- Rate limit: max **5 anonymous uploads per day** per session to prevent abuse

---

## Database Schema

### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK, default `gen_random_uuid()` |
| `name` | `VARCHAR(100)` | NOT NULL |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE, validated `@cbit.ac.in` or `@cbit.org.in` |
| `role` | `ENUM('student', 'faculty', 'admin')` | NOT NULL, default `'student'` |
| `avatar_url` | `TEXT` | NULLABLE |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()`, auto-update trigger |

> Auth is handled by Supabase Auth — `users.id` references `auth.users.id`. No password hashes stored in this table.

### `departments`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `SERIAL` | PK |
| `code` | `VARCHAR(10)` | NOT NULL, UNIQUE (e.g., `CSE`, `ECE`) |
| `name` | `VARCHAR(100)` | NOT NULL (e.g., `Computer Science & Engineering`) |
| `is_active` | `BOOLEAN` | NOT NULL, default `TRUE` |

### `subjects`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `SERIAL` | PK |
| `name` | `VARCHAR(200)` | NOT NULL |
| `code` | `VARCHAR(20)` | NULLABLE (e.g., `CS501`) |
| `department_id` | `INTEGER` | FK → `departments.id`, NOT NULL |
| `semester` | `SMALLINT` | NOT NULL, CHECK `1–8` |
| `regulation` | `VARCHAR(10)` | NOT NULL (e.g., `R22`, `R22A`) |

**Composite unique:** `(department_id, semester, name, regulation)`

### `resources`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `UUID` | PK, default `gen_random_uuid()` |
| `title` | `VARCHAR(300)` | NOT NULL |
| `description` | `TEXT` | NULLABLE |
| `subject_id` | `INTEGER` | FK → `subjects.id`, NOT NULL |
| `resource_type` | `ENUM(...)` | NOT NULL — `notes`, `question_paper`, `question_bank`, `course_pack`, `important_questions`, `calendar` |
| `file_url` | `TEXT` | NOT NULL |
| `file_name` | `VARCHAR(255)` | NOT NULL |
| `file_size` | `BIGINT` | NOT NULL, in bytes |
| `file_hash` | `VARCHAR(64)` | NOT NULL — SHA-256 of file content |
| `mime_type` | `VARCHAR(100)` | NOT NULL |
| `uploaded_by` | `UUID` | FK → `users.id`, NULLABLE (null = anonymous) |
| `is_anonymous` | `BOOLEAN` | NOT NULL, default `FALSE` |
| `is_duplicate_flagged` | `BOOLEAN` | NOT NULL, default `FALSE` |
| `duplicate_of` | `UUID` | FK → `resources.id`, NULLABLE |
| `download_count` | `INTEGER` | NOT NULL, default `0` |
| `status` | `ENUM('processing', 'active', 'deleted')` | NOT NULL, default `'processing'` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` |

### `resource_search` (Materialized view for full-text search)

```sql
CREATE MATERIALIZED VIEW resource_search AS
SELECT
  r.id,
  r.title,
  r.description,
  s.name AS subject_name,
  d.code AS department_code,
  s.semester,
  s.regulation,
  r.resource_type,
  to_tsvector('english', r.title || ' ' || COALESCE(r.description, '') || ' ' || s.name) AS search_vector
FROM resources r
JOIN subjects s ON r.subject_id = s.id
JOIN departments d ON s.department_id = d.id
WHERE r.status = 'active';
```

### Indexing Strategy

| Index | Fields | Rationale |
|-------|--------|-----------|
| `idx_resources_subject` | `subject_id` | Fast lookup by subject |
| `idx_resources_type` | `resource_type` | Filter by resource category |
| `idx_resources_uploaded_by` | `uploaded_by` | "My Uploads" dashboard |
| `idx_resources_created` | `created_at DESC` | Default sort order |
| `idx_resources_hash` | `file_hash` | Exact duplicate detection (O(1) lookup) |
| `idx_subjects_dept_sem` | `(department_id, semester)` | Subject listing per department/semester |
| `idx_subjects_regulation` | `(department_id, semester, regulation)` | Regulation-filtered queries |
| `idx_search_vector` | GIN on `search_vector` | Full-text search performance |

---

## REST API Specification

### Base URL

```
Production:  https://api.reso.cbit.ac.in/v1
Development: http://localhost:3001/v1
```

### Response Envelope

**Success:**
```json
{
  "success": true,
  "data": { },
  "message": "Resources retrieved successfully",
  "meta": { "page": 1, "per_page": 20, "total": 142 }
}
```

**Error:**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "File size exceeds 25MB limit",
  "details": { "field": "file", "max_size_mb": 25 }
}
```

### Authentication Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Register with email + password |
| `POST` | `/auth/login` | — | Login, returns JWT access + refresh token |
| `POST` | `/auth/logout` | ✅ | Invalidate refresh token |
| `POST` | `/auth/refresh` | — | Refresh expired access token |
| `GET` | `/auth/profile` | ✅ | Get authenticated user profile |

**Registration validation:**
- Email must end with `@cbit.ac.in` or `@cbit.org.in`
- Password: min 8 chars, at least 1 uppercase, 1 number
- Name: 2–100 characters, no special characters except spaces and periods

### Resource Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/resources` | — | List resources with filters + pagination |
| `GET` | `/resources/:id` | — | Get single resource with full metadata |
| `POST` | `/resources` | ✅ | Upload resource (file + metadata) |
| `PUT` | `/resources/:id` | ✅ | Update resource metadata (owner only) |
| `DELETE` | `/resources/:id` | ✅ | Soft-delete resource (owner or admin) |

**`GET /resources` query parameters:**

| Parameter | Type | Example | Behavior |
|-----------|------|---------|----------|
| `department` | string | `CSE` | Exact match on department code |
| `semester` | integer | `5` | Exact match |
| `regulation` | string | `R22` | Exact match |
| `resource_type` | string | `notes` | Exact match on enum |
| `subject` | string | `Data Structures` | Exact match on subject name |
| `search` | string | `linked list` | Full-text search (title, description, subject) |
| `page` | integer | `2` | Default: `1` |
| `per_page` | integer | `20` | Default: `20`, max: `50` |
| `sort` | string | `created_at` | Default: `created_at`, allowed: `title`, `download_count` |
| `order` | string | `desc` | Default: `desc`, allowed: `asc` |

**`POST /resources` — File upload:**

| Field | Type | Constraints |
|-------|------|-------------|
| `file` | multipart | Required. Max **25 MB**. Allowed: `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx` |
| `title` | string | Required. 5–300 chars |
| `description` | string | Optional. Max 2000 chars |
| `subject_id` | integer | Required. Must exist in `subjects` table |
| `resource_type` | string | Required. Must be valid enum value |
| `is_anonymous` | boolean | Optional. Default `false` |

**Upload flow:**
1. File validated (size, MIME type, extension)
2. SHA-256 hash computed
3. File uploaded to Supabase Storage: `/resources/{department_code}/{semester}/{resource_id}/{original_filename}`
4. Resource record created with `status = 'processing'`
5. Async duplicate check triggered (compares `file_hash` against existing resources)
6. If hash match found → `is_duplicate_flagged = true`, `duplicate_of = original_id`
7. Resource `status` set to `'active'` — visible in search regardless of duplicate flag
8. Uploader receives duplicate notification if flagged (but upload proceeds)

### Taxonomy Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/departments` | — | List all active departments |
| `GET` | `/departments/:code/subjects` | — | List subjects for department, filterable by semester and regulation |
| `GET` | `/regulations` | — | List all regulation codes |
| `GET` | `/resource-types` | — | List all resource type enum values |

### User Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/me/uploads` | ✅ | Paginated list of authenticated user's uploads |
| `GET` | `/users/me/stats` | ✅ | Upload count, total downloads received |

### Duplicate Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/resources/:id/duplicates` | — | Get duplicate info for a resource |
| `POST` | `/resources/:id/duplicate-override` | ✅ Admin | Override duplicate flag with justification |

### Error Codes

| HTTP | Error Code | When |
|------|-----------|------|
| `400` | `VALIDATION_ERROR` | Invalid input, missing required fields |
| `400` | `INVALID_FILE_TYPE` | Unsupported file format |
| `401` | `UNAUTHORIZED` | Missing or invalid JWT |
| `403` | `FORBIDDEN` | User lacks permission (e.g., deleting another's upload) |
| `404` | `NOT_FOUND` | Resource doesn't exist or is soft-deleted |
| `409` | `DUPLICATE_DETECTED` | Exact hash match found (upload still proceeds — informational) |
| `413` | `FILE_TOO_LARGE` | File exceeds 25MB |
| `429` | `RATE_LIMITED` | Too many requests — includes `Retry-After` header |
| `500` | `INTERNAL_ERROR` | Server error — never exposes stack traces |

---

## Duplicate Detection System

### Strategy: Hybrid (Global exact-match + Scoped near-duplicate)

| Detection Layer | Scope | Method | Threshold |
|----------------|-------|--------|-----------|
| **Exact duplicate** | Global (all departments) | SHA-256 file hash comparison | 100% match |
| **Near duplicate** | Scoped (same department + semester) | Cosine similarity on normalized title + description | ≥ 85% similarity |

### Detection Flow

```
Upload Complete
      │
      ├── Hash computed (SHA-256)
      │
      ├── EXACT CHECK: Query resources WHERE file_hash = new_hash
      │   └── Match? → Flag as duplicate, set duplicate_of
      │
      ├── NEAR CHECK: Within same (department_id, semester)
      │   ├── Normalize title: lowercase, strip punctuation, tokenize
      │   ├── Compute cosine similarity against existing resource titles
      │   └── Score ≥ 85%? → Flag, set duplicate_of (highest scoring match)
      │
      └── Set status = 'active' (resource always becomes visible)
```

### What Happens When a Duplicate is Flagged

- Upload proceeds immediately — no blocking
- `is_duplicate_flagged` set to `true` on the new resource
- `duplicate_of` points to the most likely original
- Uploader sees a notification: "This may be a duplicate of [original title]. You can keep your upload or remove it."
- Admin can override the flag via `POST /resources/:id/duplicate-override`

---

## Frontend Pages & Component Architecture

### Pages

| Page | Route | Auth | Description |
|------|-------|------|-------------|
| **Login** | `/login` | — | Email/password + magic link login |
| **Register** | `/register` | — | Registration with CBIT email validation |
| **Home** | `/` | — | Dashboard with sections: Browse, Upload, Official Links |
| **Browse** | `/browse` | — | Filterable, searchable resource grid |
| **Upload** | `/upload` | ✅ | File upload form with metadata fields |
| **My Uploads** | `/my-uploads` | ✅ | User's upload history with edit/delete |
| **Resource Detail** | `/resources/:id` | — | Full resource view with download, duplicate info |

### Design System

**Typography:**
- Headings: `Inter` (tight tracking, semi-bold to bold)
- Body: `Inter` (regular weight, 1.6 line-height)
- Mono/Data: `JetBrains Mono` (file sizes, metadata labels)

**Color Palette:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#FAFAFA` | Page background |
| `--bg-surface` | `#FFFFFF` | Cards, modals |
| `--bg-dark` | `#0F172A` | Dark sections, footer |
| `--text-primary` | `#0F172A` | Headlines, body text |
| `--text-secondary` | `#64748B` | Muted labels, metadata |
| `--accent` | `#6366F1` | Primary CTAs, active states, links |
| `--accent-hover` | `#4F46E5` | Hover states |
| `--success` | `#10B981` | Upload success, active status |
| `--warning` | `#F59E0B` | Duplicate flag, warnings |
| `--error` | `#EF4444` | Errors, destructive actions |
| `--border` | `#E2E8F0` | Card borders, dividers |

**Shape & Spacing:**
- Border radius: `0.75rem` (cards), `0.5rem` (buttons, inputs), `9999px` (pills, tags)
- Card shadow: `0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)`
- Grid: 12-column on desktop, 1-column on mobile, `1.5rem` gap

**Micro-Interactions:**
- Buttons: `scale(1.02)` on hover, `scale(0.98)` on active, `200ms cubic-bezier(0.4, 0, 0.2, 1)`
- Cards: `translateY(-2px)` + shadow lift on hover
- Page transitions: `opacity` + `translateY(8px)` entrance, `300ms ease-out`
- Skeleton loaders for all async data (no blank states)

### Key Components

| Component | Description |
|-----------|-------------|
| `AppNavbar` | Fixed top bar with logo, nav links, auth state, upload CTA |
| `ResourceCard` | Card showing title, subject, type badge, department, semester, download count, regulation tag |
| `ResourceGrid` | Responsive grid of `ResourceCard` components with loading skeletons |
| `FilterSidebar` | Collapsible sidebar with department, semester, regulation, type filters |
| `SearchBar` | Full-text search input with debounced API calls |
| `UploadForm` | Multi-step form: file drop → metadata fields → review → submit |
| `FileDropzone` | Drag-and-drop area with file type/size validation |
| `DuplicateAlert` | Inline alert shown after upload if duplicate flagged |
| `OfficialLinks` | Structured card grid linking to existing CBIT resources |
| `PaginationBar` | Page controls with page size selector |

---

## File Storage Strategy

| Decision | Choice |
|----------|--------|
| **Provider** | Supabase Storage |
| **Bucket** | `resources` (private — files served via signed URLs through API) |
| **Directory structure** | `/{department_code}/{semester}/{resource_id}/{filename}` |
| **Naming convention** | Original filename preserved, UUID resource ID prevents collisions |
| **Access model** | Private — files require authenticated API call to generate signed download URL (24hr expiry) |
| **Max file size** | 25 MB |
| **Allowed types** | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` |
| **Deletion strategy** | Soft delete — `status = 'deleted'` in DB, file remains in storage for 30 days, then hard-deleted by cron |

---

## Security Considerations

### Authentication & Authorization
- Supabase Auth handles JWT issuance and verification
- Express middleware validates JWT on every protected route
- Custom claims enriched server-side: `role`, `user_id`
- Route-level RBAC enforced via `authorize(['admin'])` middleware
- Delete permission checked against `uploaded_by` field

### Row-Level Security (RLS)
- Enabled on all tables
- `resources`: anyone can SELECT active resources; only `uploaded_by = auth.uid()` can UPDATE/DELETE; admins bypass via service role
- `users`: users can only SELECT/UPDATE their own row
- Storage bucket: authenticated users can INSERT to `resources/` path; signed URL generation gated by API

### Rate Limiting
| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Auth (login/register) | 10 requests | 15 min |
| Resource upload | 20 uploads | 1 hour |
| Search/browse | 60 requests | 1 min |
| File download | 30 downloads | 1 min |
| Anonymous upload | 5 uploads | 24 hours |

### Input Validation
- Server-side Zod schemas on all API routes
- File MIME type validated server-side (not just extension)
- User-generated content (title, description) sanitized before storage and rendering
- SQL injection prevented by parameterized Supabase queries

---

## Deployment Scope & Scaling

### Phase 1 — MVP (CSE Department)
- Single department: Computer Science & Engineering
- Seed `departments` and `subjects` tables with CSE curriculum
- All core features: auth, browse, upload, search, filter, my uploads, official links
- Target: functional, deployed, usable by CSE students

### Phase 2 — Multi-Department Expansion
- Add ECE, EEE, Mechanical, Civil departments
- Admin panel for managing departments, subjects, and regulations
- Usage analytics dashboard

### Phase 3 — Community Features
- Community ratings (upvote/downvote resources)
- Contributor profiles and recognition
- Featured resources section
- Enhanced duplicate detection (content similarity, not just hash)

### Phase 4 — Intelligence Layer
- ML-enhanced duplicate detection using user feedback signals
- Recommendation engine: "Students who downloaded X also downloaded Y"
- Auto-tagging resources based on content analysis

---

## Build Sequence — Execution Order

```
WEEK 1: Foundation
├── Initialize Vue 3 + Vite project with Tailwind CSS
├── Set up Supabase project (DB, Auth, Storage)
├── Create database schema (migrations)
├── Implement design system (index.css, tokens, base components)
└── Build AppNavbar, AppFooter, layout scaffolding

WEEK 2: Auth + Upload
├── Implement auth flow (register, login, logout, profile)
├── Build UploadForm + FileDropzone components
├── Create Express upload endpoint with file validation
├── Implement Supabase Storage integration
└── Build My Uploads page

WEEK 3: Browse + Search
├── Build ResourceCard, ResourceGrid, FilterSidebar
├── Implement GET /resources with filters + pagination
├── Add full-text search (PostgreSQL tsvector)
├── Build Browse page with responsive layout
└── Build Resource Detail page

WEEK 4: Polish + Deploy
├── Implement duplicate detection (hash-based)
├── Build Official Links page
├── Add error boundaries, loading states, empty states
├── Responsive design pass (mobile, tablet)
├── Deploy: Vercel (frontend) + Render (backend)
└── Seed CSE department data
```

---

## Development Setup

```bash
# Clone
git clone https://github.com/your-org/reso.git
cd reso

# Frontend
cd frontend
npm install
cp .env.example .env.local    # Add Supabase keys
npm run dev                    # → http://localhost:5173

# Backend
cd ../backend
npm install
cp .env.example .env           # Add Supabase keys, storage config
npm run dev                    # → http://localhost:3001
```

### Environment Variables

**Frontend (`.env.local`):**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:3001/v1
```

**Backend (`.env`):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

> ⚠️ **Never** commit `.env` files. `SUPABASE_SERVICE_ROLE_KEY` is a server-only secret that bypasses RLS — never expose it to the frontend.

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [`api.md`](./api.md) | Detailed API endpoint specifications and request/response examples |
| [`auth.md`](./auth.md) | Authentication flow, JWT middleware stack, RBAC implementation guide |
| [`audit.md`](./audit.md) | Security audit checklist and vulnerability assessment framework |

---

## Context for Planning

This is not a prototype — it's intended for **actual deployment at CBIT** with ongoing use and growth. Architecture decisions account for:

- **Scalability**: from 1 department to 8+ departments without schema redesign
- **Maintainability**: clear separation of concerns, consistent API patterns
- **Institutional adoption**: faculty advisor is the key stakeholder
- **Growth**: the `departments` and `subjects` tables are designed for expansion, not hardcoded
- **Real-world constraints**: free-tier storage limits, college network reliability, student device diversity
