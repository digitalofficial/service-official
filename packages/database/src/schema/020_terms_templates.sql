CREATE TABLE IF NOT EXISTS terms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('estimate', 'invoice', 'both')),
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
