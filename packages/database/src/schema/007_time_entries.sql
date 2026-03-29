-- ============================================================
-- TIME ENTRIES — Track employee hours per job
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Time
  date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  hours DECIMAL(5,2) NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  -- Pay
  hourly_rate DECIMAL(10,2), -- snapshot from profile at time of entry
  total_pay DECIMAL(10,2),   -- hours * hourly_rate
  -- Notes
  description TEXT,
  -- Meta
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_entries_job ON time_entries(job_id);
CREATE INDEX idx_time_entries_profile ON time_entries(profile_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_org ON time_entries(organization_id);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries_select" ON time_entries FOR SELECT USING (
  organization_id = public.get_org_id()
);
CREATE POLICY "time_entries_insert" ON time_entries FOR INSERT WITH CHECK (
  organization_id = public.get_org_id()
);
CREATE POLICY "time_entries_update" ON time_entries FOR UPDATE USING (
  organization_id = public.get_org_id()
);
CREATE POLICY "time_entries_delete" ON time_entries FOR DELETE USING (
  organization_id = public.get_org_id()
);

-- Updated_at trigger
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON time_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
