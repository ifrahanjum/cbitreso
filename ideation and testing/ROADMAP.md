# ifrah's todolist: reso

## Milestone 1: Foundation & Core Frontend (MVP)

### Phase 1: Project Setup & Design System ✅
- [x] Initialize Frontend (Vue 3 + Vite + Tailwind + Pinia)
- [x] Initialize Backend scaffold (Express + Supabase client)
- [x] Design system: "Midnight Luxe" aesthetic (dark theme, glassmorphism, accent color tokens)
- [x] Custom fonts: Zen Dots (branding), Inter/system (body), mono stack (labels)
- [x] Reusable components: `TiltCard`, `SearchBar`, `Dropdown` (searchable combobox)
- [x] Grid background, micro-animations, parallax hero effects
- [x] GSAP + ScrollTrigger integration for scroll-driven animations

### Phase 2: Landing Page & Navigation ✅
- [x] Home page (`/`) with hero section, tagline, and feature cards
- [x] Global header with Zen Dots "RESO" branding and nav links
- [x] Department/Semester sync widget on home hero (vertical stack layout)
- [x] Sync persists to `localStorage` via Pinia `useConfigStore`
- [x] Sync redirects to `/explorer` after saving preferences
- [x] Search bar with live suggestion dropdown (mock data)
- [x] Black shimmer effect on hero heading text

### Phase 3: Curriculum & Resource Architecture ✅
- [x] Shared `curriculum.js` data file (CSE R22 Semesters 1–8, all theory/practical/elective/mandatory courses)
- [x] Centralized `useResourceStore` (Pinia) as single source of truth for all resources
- [x] Resources include: Notes, Question Papers, Question Banks, Syllabus documents
- [x] Unit-specific notes mapped to real R22 subjects (e.g., DBMS Unit 2, OS Unit 1)
- [x] `parsed_syllabus.json` extracted from official R22 PDF for unit-level content

### Phase 4: Subject Explorer (`/explorer`) ✅
- [x] Multi-step drill-down: Department → Semester → Subject → Content
- [x] Breadcrumb navigation with back button
- [x] Subject list filtered from shared `curriculum.js` (real course codes and names)
- [x] Search and sort (alphabetical / course code) within subject step
- [x] Content step: resource grid organized by type (Notes, Question Banks, Syllabus)
- [x] Bookmark/save icon on each resource card
- [x] "SAVED" ribbon on bookmarked items
- [x] Saved items sorted to top of each section
- [x] Empty-state message when no resources exist for a category

### Phase 5: Browse View (`/browse`) ✅
- [x] Flat resource grid pulling from centralized `useResourceStore`
- [x] Filter by department, semester, and resource type
- [x] Sidebar with department pill selector, type checkboxes, sort dropdown
- [x] Bookmark toggle with saved-items-first sorting
- [x] Saved ribbon and visual indicators consistent with Explorer

### Phase 6: Question Papers (`/question-papers`) ✅
- [x] Dedicated archive view for exam papers (MID-1, MID-2, Semester End)
- [x] Sidebar: quick sync widget, paper type checkboxes, regulation filters
- [x] Resources pulled from centralized store (filtered by `type: Question Paper`)
- [x] Bookmark/save with ribbon and sorted display
- [x] Empty-state handler when no papers match filters
- [x] Year display and View Paper / Download action buttons

### Phase 7: Syllabus Hub (`/syllabus`) ✅
- [x] Full R22 CSE curriculum display (Semesters 1–8)
- [x] Course cards with code, name, credits, and type badge (Theory/Practical/Elective/Mandatory)
- [x] Department, semester, category, and search filters
- [x] Overview stats: total credits, course count, department, semester
- [x] Course detail modal with unit-by-unit syllabus breakdown (from `parsed_syllabus.json`)
- [x] Timeline-style unit display with animated dots
- [x] Download Full PDF button (links to R22 syllabus PDF)
- [x] Shared data source via `curriculum.js` for consistency with Explorer

### Phase 8: Supporting Pages ✅
- [x] Login page (`/login`) — styled UI with CBIT email field (frontend only, no auth wired)
- [x] Upload page (`/upload`) — multi-step form UI (frontend only, no storage wired)
- [x] Reader page (`/reader`) — document viewer shell with query-param title
- [x] Schedules page (`/schedules`) — academic calendar / timetable view

### Phase 9: Cross-Cutting Features ✅
- [x] Global state sync: Dept/Sem preferences persist across all views via `useConfigStore`
- [x] Saved resources: `toggleSave` / `isSaved` with `localStorage` persistence
- [x] Saved items pinned to top across Explorer, Browse, and Question Papers
- [x] Consistent grid background on all pages (no white pulse)
- [x] Searchable combobox dropdown component (global `Dropdown.vue`)

---

## Milestone 2: Backend Integration & Auth 🔲

### Phase 10: Supabase Auth ✅
- [x] Custom CBIT validation: student roll number (`1601YY[dept]XXX`) with dept-code-as-password
- [x] Custom CBIT validation: faculty email (`name_dept@cbit.ac.in`) with dept-as-password
- [x] Confirmed 12 department codes (732–805) including AIML, AIDS, CET, CHEM, BIO
- [x] Backend auth module (`auth.js`) with `validateStudent` / `validateFaculty`
- [x] Express routes: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- [x] Supabase Auth integration: auto-create users on first login, synthetic email for students
- [x] Frontend Pinia `useAuthStore` (login, logout, checkSession, localStorage persistence)
- [x] LoginView wired: loading spinners, error/success messages, redirect-after-login
- [x] Route guard on `/upload` (redirects to `/login?redirect=...`)
- [x] Dynamic navbar: Login button → user badge + Logout when authenticated
- [x] Schema updated: `roll_no`, `department_code`, `identifier_type` on `users` table
- [x] RLS policies on `users` table
- [x] Seeded all 12 CBIT departments in schema

### Phase 11: Database & API ✅
- [x] Schema deployed to Supabase (departments, subjects, resources, users tables)
- [x] Seeded full R22 CSE curriculum (27 subjects) + 23 mock resources via `seed.js`
- [x] Auth middleware stack: token extraction, JWT verification via `getUser()`, claims hydration, RBAC factory
- [x] Rate limiting: auth (10/15min), browse (60/min) via `express-rate-limit`
- [x] Express API routes: `GET /departments`, `/departments/:code/subjects`, `/regulations`, `/resource-types`
- [x] Express API routes: `GET /resources` (pagination, filters, search, sort), `GET /resources/:id`
- [x] Frontend `useResourceStore` rewritten: API-backed with loading/error/pagination
- [x] Frontend `useCurriculumStore` created: API-backed subject/department fetching
- [x] `BrowseView` wired to API with reactive filters, debounced search, loading skeletons
- [x] `SubjectExplorerView` wired to API (subjects fetched on semester select)
- [x] `QuestionPapersView` wired to API (filters question_paper type)
- [x] `SyllabusView` wired to API (subjects from DB, units still from local JSON)
- [x] Environment-aware CORS (localhost in dev, production domain in prod)

### Phase 12: Upload & Storage
- [x] Wire Upload form to Supabase Storage buckets
- [x] Backend upload handler with Zod validation
- [x] File hash computation for duplicate detection
- [x] Resource status workflow: processing → active
- [x] File size limits and MIME type validation

### Phase 13: Search & Discovery
- [x] Wire SearchBar to PostgreSQL full-text search (materialized view)
- [x] Real-time search suggestions from API
- [x] Search results page with highlighted matches
- [x] Filter integration with search queries

---

## Milestone 3: Expansion & Community 🔲

- [ ] Multi-department data expansion (ECE, EEE, IT, AIML, etc.)
- [ ] Upvote/downvote resources
- [ ] Contributor profiles and upload history
- [ ] Resource comments / discussion threads
- [ ] Admin dashboard for content moderation
- [ ] PWA support for offline access
- [ ] Push notifications for new uploads in saved subjects

---

## Architecture Summary

```
frontend/                   # Vue 3 + Vite + Tailwind + Pinia
├── src/
│   ├── components/         # TiltCard, SearchBar, Dropdown
│   ├── data/               # curriculum.js, parsed_syllabus.json
│   ├── store/              # config.js (sync + saves), resources.js (resource data)
│   ├── views/              # 9 page views
│   └── router/             # Vue Router (9 routes)
backend/                    # Express + Supabase (scaffold only)
├── index.js                # Health check + CORS
└── schema.sql              # PostgreSQL schema (not yet deployed)
```
