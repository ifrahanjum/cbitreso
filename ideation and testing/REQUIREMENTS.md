# Requirements: reso

## Functional Requirements
1. **Authentication**
   - CBIT email domain restriction (@cbit.ac.in, @cbit.org.in).
   - JWT-based auth via Supabase.
   - User roles: Student, Faculty, Admin.

2. **Resource Management**
   - Upload resources (PDF, DOC, PPT) with metadata.
   - Metadata: Title, Description, Subject, Department, Semester, Regulation, Type.
   - Anonymous upload option (rate-limited).
   - Soft-delete for owners and admins.

3. **Discovery**
   - Full-text search (tsvector).
   - Hierarchical browse: Dept -> Sem -> Subject.
   - Filters: Type, Regulation.

4. **Duplicate Detection**
   - Hash-based exact duplicate detection.
   - Title similarity detection.

## Non-Functional Requirements
- **Performance**: < 2s page load.
- **Security**: Row-Level Security (RLS) on all tables.
- **Design**: Premium "Digital Curator" aesthetic.
- **Scalability**: Support multiple departments.
