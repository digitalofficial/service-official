-- ============================================================
-- RLS for organization_domains
-- ============================================================

ALTER TABLE organization_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_domains_select" ON organization_domains FOR SELECT USING (
  organization_id = public.get_org_id()
);
CREATE POLICY "org_domains_insert" ON organization_domains FOR INSERT WITH CHECK (
  organization_id = public.get_org_id()
);

-- ============================================================
-- INVITATIONS TABLE
-- ============================================================

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'technician',
  invited_by UUID REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_org ON invitations(organization_id);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select" ON invitations FOR SELECT USING (
  organization_id = public.get_org_id()
);
CREATE POLICY "invitations_insert" ON invitations FOR INSERT WITH CHECK (
  organization_id = public.get_org_id()
);
CREATE POLICY "invitations_update" ON invitations FOR UPDATE USING (
  organization_id = public.get_org_id()
);
-- Public read for token lookup (accept invite flow)
CREATE POLICY "invitations_select_by_token" ON invitations FOR SELECT USING (
  token IS NOT NULL
);
