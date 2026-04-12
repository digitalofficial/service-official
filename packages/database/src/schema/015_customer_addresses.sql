-- ============================================================
-- CUSTOMER ADDRESSES — Multiple addresses for commercial/HOA/property_manager
-- ============================================================

CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Main', -- e.g. "Main Office", "Warehouse", "Unit 4B"
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  is_primary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one primary address per customer
CREATE UNIQUE INDEX idx_customer_addresses_primary
  ON customer_addresses (customer_id)
  WHERE is_primary = TRUE;

CREATE INDEX idx_customer_addresses_customer ON customer_addresses (customer_id);
CREATE INDEX idx_customer_addresses_org ON customer_addresses (organization_id);

-- RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_addresses_org_isolation ON customer_addresses
  USING (organization_id = current_setting('app.organization_id', true)::uuid);

-- Trigger to keep updated_at current
CREATE TRIGGER customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
