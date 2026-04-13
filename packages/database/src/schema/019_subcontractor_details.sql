-- 019: Add detailed fields to subcontractors table
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS coi_file_url TEXT;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS general_liability_policy TEXT;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS general_liability_expiry DATE;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS workers_comp_policy TEXT;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS workers_comp_expiry DATE;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS auto_insurance_policy TEXT;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS auto_insurance_expiry DATE;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('check', 'direct_deposit', 'ach', 'zelle', 'venmo', 'other'));
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS payment_rate NUMERIC;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS payment_rate_type TEXT CHECK (payment_rate_type IN ('hourly', 'daily', 'per_job', 'percentage'));
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS w9_on_file BOOLEAN DEFAULT false;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS ein TEXT;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS license_expiry DATE;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS trades TEXT[];
