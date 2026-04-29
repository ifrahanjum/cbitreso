CREATE TYPE resource_category AS ENUM ('notes', 'question_paper', 'question_bank', 'course_pack', 'important_questions', 'calendar');
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');
CREATE TYPE resource_status AS ENUM ('processing', 'active', 'deleted');

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20),
    department_id INTEGER NOT NULL REFERENCES departments(id),
    semester SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    regulation VARCHAR(10) NOT NULL,
    UNIQUE(department_id, semester, name, regulation)
);

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    roll_no VARCHAR(12),
    department_code VARCHAR(10),
    identifier_type VARCHAR(10) CHECK (identifier_type IN ('student', 'faculty')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    resource_type resource_category NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    is_duplicate_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_of UUID REFERENCES resources(id),
    download_count INTEGER NOT NULL DEFAULT 0,
    status resource_status NOT NULL DEFAULT 'processing',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX idx_search_vector ON resource_search USING GIN(search_vector);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON resources FOR SELECT USING (status = 'active');
CREATE POLICY "Auth insert" ON resources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owner update" ON resources FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Own profile read" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Service upsert" ON users FOR ALL USING (true);

INSERT INTO departments (code, name) VALUES 
('CSE', 'Computer Science & Engineering'),
('ECE', 'Electronics & Communication Engineering'),
('EEE', 'Electrical & Electronics Engineering'),
('MEC', 'Mechanical Engineering'),
('CIV', 'Civil Engineering'),
('IT', 'Information Technology'),
('AIML', 'Artificial Intelligence & Machine Learning'),
('CSE-AIML', 'CSE (AI & ML)'),
('CET', 'Computer Engineering & Technology'),
('AIDS', 'Artificial Intelligence & Data Science'),
('CHEM', 'Chemical Engineering'),
('BIO', 'Biotechnology');

INSERT INTO subjects (name, code, department_id, semester, regulation) VALUES
('Data Structures', 'CS301', 1, 3, 'R22'),
('Operating Systems', 'CS402', 1, 4, 'R22'),
('Discrete Mathematics', 'CS303', 1, 3, 'R22');
