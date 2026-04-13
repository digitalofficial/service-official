-- 024: Architect Portal — Change Requests + Portal User Roles
-- The portal_messages table already exists (012_tier1_features.sql).
-- This migration adds change_requests and extends portal_users.

-- Change requests from portal users
CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_review')),
  attachments JSONB DEFAULT '[]',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_requests_project ON change_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_submitted_by ON change_requests(submitted_by);

-- Add role and company_name to portal_users if not exists
ALTER TABLE portal_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'architect', 'gc'));
ALTER TABLE portal_users ADD COLUMN IF NOT EXISTS company_name TEXT;
