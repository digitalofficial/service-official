-- ============================================================
-- Per-org Twilio credentials (encrypted at rest by Supabase)
-- ============================================================

CREATE TABLE organization_sms_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  -- Default reminder preferences (org-wide defaults)
  default_reminder_1 INTERVAL DEFAULT '1 day',    -- e.g. 1 day before
  default_reminder_2 INTERVAL DEFAULT '1 hour',   -- e.g. 1 hour before
  send_assignment_sms BOOLEAN DEFAULT TRUE,        -- SMS when job assigned
  send_completion_sms BOOLEAN DEFAULT FALSE,       -- SMS when job completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organization_sms_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sms_settings_select" ON organization_sms_settings FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "sms_settings_upsert" ON organization_sms_settings FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "sms_settings_update" ON organization_sms_settings FOR UPDATE USING (organization_id = public.get_org_id());

-- ============================================================
-- Job reminders
-- ============================================================

CREATE TABLE job_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- When to send
  remind_at TIMESTAMPTZ NOT NULL,
  -- What was scheduled
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('1_day', '1_hour', '30_min', '15_min', 'custom', 'assignment')),
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'canceled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  -- Message content (cached at creation time)
  phone_number TEXT NOT NULL,
  message_body TEXT NOT NULL,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_reminders_pending ON job_reminders(remind_at, status) WHERE status = 'pending';
CREATE INDEX idx_job_reminders_job ON job_reminders(job_id);

ALTER TABLE job_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_reminders_select" ON job_reminders FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "job_reminders_insert" ON job_reminders FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "job_reminders_update" ON job_reminders FOR UPDATE USING (organization_id = public.get_org_id());

-- Trigger for updated_at on sms_settings
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON organization_sms_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
