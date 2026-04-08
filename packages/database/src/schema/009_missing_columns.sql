-- ============================================================
-- 009: Add missing columns referenced in application code
-- ============================================================

-- Reminder preferences on profiles (used by job assignment SMS flow)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reminder_pref_1 TEXT DEFAULT '1 day',
  ADD COLUMN IF NOT EXISTS reminder_pref_2 TEXT DEFAULT '1 hour';

-- Stripe Connect fields on organizations (used by payment settings & invoice sending)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT,
  ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT,
  ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT,
  ADD COLUMN IF NOT EXISTS payments_enabled BOOLEAN DEFAULT FALSE;
