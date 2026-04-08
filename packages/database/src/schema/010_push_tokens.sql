-- Add push notification token column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Index for looking up tokens by organization (for broadcast notifications)
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(organization_id) WHERE push_token IS NOT NULL;
