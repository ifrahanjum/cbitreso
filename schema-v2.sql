
ALTER TABLE resources ADD COLUMN IF NOT EXISTS fts tsvector;

CREATE INDEX IF NOT EXISTS resources_fts_idx ON resources USING GIN (fts);

CREATE OR REPLACE FUNCTION resources_fts_update() RETURNS trigger AS $$
DECLARE
  sub_name text;
  sub_code text;
BEGIN
  SELECT name, code INTO sub_name, sub_code FROM subjects WHERE id = NEW.subject_id;
  
  NEW.fts :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(sub_code, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(sub_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
    
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tsvectorupdate ON resources;
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON resources FOR EACH ROW EXECUTE FUNCTION resources_fts_update();

UPDATE resources SET updated_at = NOW();
