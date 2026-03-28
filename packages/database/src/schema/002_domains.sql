-- Run this in Supabase SQL Editor
-- Adds custom domain support for multi-tenant

CREATE TABLE organization_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE, -- e.g. service.smithroofing.com
  is_primary BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_domains_domain ON organization_domains(domain);

-- Seed domains
-- Admin portal (Digital Official)
INSERT INTO organization_domains (organization_id, domain, is_primary, is_verified, verified_at)
SELECT id, 'service.thedigitalofficial.com', true, true, NOW()
FROM organizations
WHERE slug = 'service-official'
LIMIT 1;

-- Client domain (Platinum Builders)
INSERT INTO organization_domains (organization_id, domain, is_primary, is_verified, verified_at)
SELECT id, 'service.platinumbuildersllc.com', false, true, NOW()
FROM organizations
WHERE slug = 'service-official'
LIMIT 1;
