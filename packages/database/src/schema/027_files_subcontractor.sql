-- ============================================================
-- 027_files_subcontractor.sql
-- Allow uploading documents / photos against a subcontractor
-- (COI, W-9, license, misc docs). Mirrors existing polymorphic
-- file links on project / job / customer.
-- ============================================================

ALTER TABLE files
  ADD COLUMN IF NOT EXISTS subcontractor_id UUID REFERENCES subcontractors(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS files_subcontractor_idx ON files(subcontractor_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
