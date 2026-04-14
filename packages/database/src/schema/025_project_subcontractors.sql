-- ============================================================
-- 025_project_subcontractors.sql
-- Tighten project_subcontractors: add org_id (tenant scoping),
-- RLS, notes, hours tracking, and a job-level assignment table.
-- ============================================================

-- 1. Add columns to project_subcontractors
ALTER TABLE project_subcontractors
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS hours_logged DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Backfill organization_id from parent project
UPDATE project_subcontractors ps
SET organization_id = p.organization_id
FROM projects p
WHERE ps.project_id = p.id AND ps.organization_id IS NULL;

-- 3. Enforce NOT NULL after backfill
ALTER TABLE project_subcontractors
  ALTER COLUMN organization_id SET NOT NULL;

-- 4. Prevent duplicate assignments
CREATE UNIQUE INDEX IF NOT EXISTS project_subcontractors_unique
  ON project_subcontractors(project_id, subcontractor_id);

CREATE INDEX IF NOT EXISTS project_subcontractors_org_idx
  ON project_subcontractors(organization_id);

-- 5. Enable RLS
ALTER TABLE project_subcontractors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_subcontractors_org_isolation ON project_subcontractors;
CREATE POLICY project_subcontractors_org_isolation ON project_subcontractors
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- 6. Job-level subcontractor assignments
CREATE TABLE IF NOT EXISTS job_subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  subcontractor_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  scope TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','in_progress','completed','cancelled')),
  hours_logged DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  assigned_by UUID REFERENCES profiles(id),
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, subcontractor_id)
);

CREATE INDEX IF NOT EXISTS job_subcontractors_org_idx ON job_subcontractors(organization_id);
CREATE INDEX IF NOT EXISTS job_subcontractors_sub_idx ON job_subcontractors(subcontractor_id);

ALTER TABLE job_subcontractors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_subcontractors_org_isolation ON job_subcontractors;
CREATE POLICY job_subcontractors_org_isolation ON job_subcontractors
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- 7. Backfill RLS gaps on cost_codes / terms_templates (defense-in-depth)
ALTER TABLE cost_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cost_codes_org_isolation ON cost_codes;
CREATE POLICY cost_codes_org_isolation ON cost_codes
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'terms_templates') THEN
    EXECUTE 'ALTER TABLE terms_templates ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS terms_templates_org_isolation ON terms_templates';
    EXECUTE 'CREATE POLICY terms_templates_org_isolation ON terms_templates
      FOR ALL
      USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
      WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))';
  END IF;
END $$;
