
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Public read access for departments" ON departments;
CREATE POLICY "Public read access for departments" ON departments
  FOR SELECT USING (is_active = true);


DROP POLICY IF EXISTS "Public read access for subjects" ON subjects;
CREATE POLICY "Public read access for subjects" ON subjects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for active resources" ON resources;
CREATE POLICY "Public read access for active resources" ON resources
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Authenticated users can insert resources" ON resources;
CREATE POLICY "Authenticated users can insert resources" ON resources
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Owners can update their own resources" ON resources;
CREATE POLICY "Owners can update their own resources" ON resources
  FOR UPDATE USING (auth.uid() = uploaded_by OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Owners can delete their own resources" ON resources;
CREATE POLICY "Owners can delete their own resources" ON resources
  FOR DELETE USING (auth.uid() = uploaded_by OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Public read access for user profiles" ON users;
CREATE POLICY "Public read access for user profiles" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
