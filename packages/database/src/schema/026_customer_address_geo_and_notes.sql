-- ============================================================
-- 026_customer_address_geo_and_notes.sql
-- Add lat/lng to customer_addresses + organizations for mapping,
-- and a per-address notes audit trail (for PM/HOA/commercial
-- workflows where each property needs its own running notes).
-- ============================================================

-- 1. Geo columns on customer_addresses
ALTER TABLE customer_addresses
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- 2. Geo columns on organizations (HQ pin)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- 3. Per-address notes (multi-entry, author + timestamp)
CREATE TABLE IF NOT EXISTS customer_address_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_id UUID NOT NULL REFERENCES customer_addresses(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_address_notes_address_idx
  ON customer_address_notes(address_id);
CREATE INDEX IF NOT EXISTS customer_address_notes_org_idx
  ON customer_address_notes(organization_id);

ALTER TABLE customer_address_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS customer_address_notes_org_isolation ON customer_address_notes;
CREATE POLICY customer_address_notes_org_isolation ON customer_address_notes
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));
