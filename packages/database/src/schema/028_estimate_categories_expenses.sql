-- 028: Add category to estimate line items + estimate_expenses table
-- Line item categories: Materials, Labor, Parts
-- Estimate expenses: internal-only cost tracking (not shown to customer)

-- Add category column to estimate_line_items
ALTER TABLE estimate_line_items
  ADD COLUMN IF NOT EXISTS category text;

-- Create estimate_expenses table (internal only)
CREATE TABLE IF NOT EXISTS estimate_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  amount decimal(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estimate_expenses_estimate_id
  ON estimate_expenses(estimate_id);

-- RLS
ALTER TABLE estimate_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage estimate expenses in their org"
  ON estimate_expenses
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));
