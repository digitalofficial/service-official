-- ============================================================
-- SERVICE OFFICIAL — Tier 1 Features Migration
-- Equipment, Budget, Purchase Orders, Gantt, Inspections, Client Portal
-- ============================================================

-- ============================================================
-- NEW ENUMS
-- ============================================================

CREATE TYPE equipment_status AS ENUM ('available', 'assigned', 'maintenance', 'repair', 'retired');
CREATE TYPE equipment_condition AS ENUM ('excellent', 'good', 'fair', 'poor');
CREATE TYPE maintenance_type AS ENUM ('preventive', 'corrective', 'inspection', 'calibration');
CREATE TYPE maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'skipped');

CREATE TYPE budget_category_type AS ENUM (
  'materials', 'labor', 'equipment', 'subcontractor', 'permits',
  'fuel', 'overhead', 'contingency', 'other'
);

CREATE TYPE po_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'sent', 'acknowledged',
  'partial', 'fulfilled', 'closed', 'canceled'
);
CREATE TYPE po_receipt_condition AS ENUM ('good', 'damaged', 'wrong_item', 'short');

CREATE TYPE gantt_dependency_type AS ENUM ('FS', 'FF', 'SS', 'SF');

CREATE TYPE inspection_status AS ENUM ('scheduled', 'in_progress', 'completed', 'failed', 'canceled');
CREATE TYPE checklist_item_type AS ENUM ('checkbox', 'pass_fail', 'text', 'number', 'photo', 'signature', 'select');
CREATE TYPE inspection_result AS ENUM ('pass', 'fail', 'partial');
CREATE TYPE inspection_item_status AS ENUM ('pending', 'pass', 'fail', 'na');

CREATE TYPE portal_message_direction AS ENUM ('client_to_staff', 'staff_to_client');

-- ============================================================
-- FEATURE 1: EQUIPMENT MANAGEMENT
-- ============================================================

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- excavator, generator, compressor, truck, trailer, etc.
  make TEXT,
  model TEXT,
  year INTEGER,
  serial_number TEXT,
  vin TEXT,
  license_plate TEXT,
  -- Financial
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  current_value DECIMAL(12,2),
  daily_rate DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  -- Status
  status equipment_status DEFAULT 'available',
  condition equipment_condition DEFAULT 'good',
  -- Location
  current_location TEXT,
  -- Maintenance
  last_service_date DATE,
  next_service_date DATE,
  service_interval_days INTEGER,
  meter_reading DECIMAL(12,2),
  meter_unit TEXT DEFAULT 'hours' CHECK (meter_unit IN ('hours', 'miles', 'kilometers')),
  -- Insurance
  insurance_policy TEXT,
  insurance_expiry DATE,
  -- Meta
  photo_url TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id),
  start_date DATE NOT NULL,
  end_date DATE,
  actual_return_date DATE,
  daily_rate DECIMAL(10,2),
  total_cost DECIMAL(12,2),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipment_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  type maintenance_type DEFAULT 'preventive',
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  completed_date DATE,
  cost DECIMAL(10,2),
  vendor_name TEXT,
  meter_reading DECIMAL(12,2),
  next_service_date DATE,
  performed_by UUID REFERENCES profiles(id),
  notes TEXT,
  status maintenance_status DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_equipment_org ON equipment(organization_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_assignments_equip ON equipment_assignments(equipment_id);
CREATE INDEX idx_equipment_assignments_project ON equipment_assignments(project_id);
CREATE INDEX idx_equipment_maintenance_equip ON equipment_maintenance(equipment_id);
CREATE INDEX idx_equipment_maintenance_scheduled ON equipment_maintenance(scheduled_date);

-- ============================================================
-- FEATURE 2: BUDGET MANAGEMENT
-- ============================================================

CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type budget_category_type NOT NULL,
  budgeted_amount DECIMAL(12,2) DEFAULT 0,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budget_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  budgeted_amount DECIMAL(12,2) DEFAULT 0,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  material_id UUID REFERENCES project_materials(id) ON DELETE SET NULL,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add budget_category_id to existing tables
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS budget_category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL;
ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS budget_category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL;

CREATE INDEX idx_budget_categories_project ON budget_categories(project_id);
CREATE INDEX idx_budget_line_items_project ON budget_line_items(project_id);
CREATE INDEX idx_budget_line_items_category ON budget_line_items(budget_category_id);

-- ============================================================
-- FEATURE 3: PURCHASE ORDERS
-- ============================================================

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  website TEXT,
  payment_terms TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id),
  -- PO Info
  po_number TEXT NOT NULL,
  title TEXT,
  status po_status DEFAULT 'draft',
  -- Dates
  issue_date DATE DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  delivered_at TIMESTAMPTZ,
  -- Financials
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  -- Terms
  payment_terms TEXT,
  shipping_address TEXT,
  notes TEXT,
  internal_notes TEXT,
  -- Approval
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  -- Meta
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE po_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  project_material_id UUID REFERENCES project_materials(id) ON DELETE SET NULL,
  catalog_material_id UUID REFERENCES material_catalog(id) ON DELETE SET NULL,
  -- Item
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  quantity DECIMAL(12,4) NOT NULL,
  quantity_received DECIMAL(12,4) DEFAULT 0,
  unit TEXT,
  unit_cost DECIMAL(10,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  order_index INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE po_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  received_by UUID REFERENCES profiles(id),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  photo_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE po_receipt_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_id UUID NOT NULL REFERENCES po_receipts(id) ON DELETE CASCADE,
  po_line_item_id UUID NOT NULL REFERENCES po_line_items(id),
  quantity_received DECIMAL(12,4) NOT NULL,
  condition po_receipt_condition DEFAULT 'good',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add purchase_order_id to project_materials
ALTER TABLE project_materials ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL;

CREATE INDEX idx_vendors_org ON vendors(organization_id);
CREATE INDEX idx_purchase_orders_org ON purchase_orders(organization_id);
CREATE INDEX idx_purchase_orders_project ON purchase_orders(project_id);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_po_line_items_po ON po_line_items(purchase_order_id);

-- ============================================================
-- FEATURE 4: GANTT CHART SCHEDULING
-- ============================================================

CREATE TABLE gantt_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES gantt_tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date) STORED,
  progress DECIMAL(5,2) DEFAULT 0,
  is_milestone BOOLEAN DEFAULT FALSE,
  assigned_to UUID REFERENCES profiles(id),
  color TEXT,
  order_index INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gantt_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  predecessor_id UUID NOT NULL REFERENCES gantt_tasks(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES gantt_tasks(id) ON DELETE CASCADE,
  dependency_type gantt_dependency_type DEFAULT 'FS',
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(predecessor_id, successor_id)
);

CREATE INDEX idx_gantt_tasks_project ON gantt_tasks(project_id);
CREATE INDEX idx_gantt_deps_project ON gantt_dependencies(project_id);

-- ============================================================
-- FEATURE 5: INSPECTIONS & CHECKLISTS
-- ============================================================

CREATE TABLE inspection_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = system template
  name TEXT NOT NULL,
  description TEXT,
  trade TEXT,
  category TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
  section_id UUID REFERENCES template_sections(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  type checklist_item_type DEFAULT 'checkbox',
  is_required BOOLEAN DEFAULT FALSE,
  options JSONB, -- for 'select' type: ["Option A", "Option B"]
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  template_id UUID REFERENCES inspection_templates(id),
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  -- Info
  inspection_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status inspection_status DEFAULT 'scheduled',
  -- Schedule
  scheduled_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  completed_by UUID REFERENCES profiles(id),
  -- Results
  pass_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  na_count INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  overall_result inspection_result,
  -- Notes
  notes TEXT,
  location TEXT,
  -- Meta
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inspection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  template_item_id UUID REFERENCES template_items(id),
  section_name TEXT,
  label TEXT NOT NULL,
  type checklist_item_type DEFAULT 'checkbox',
  is_required BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  -- Response
  value TEXT,
  status inspection_item_status DEFAULT 'pending',
  notes TEXT,
  photo_ids UUID[] DEFAULT '{}',
  signature_url TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inspection_templates_org ON inspection_templates(organization_id);
CREATE INDEX idx_inspections_org ON inspections(organization_id);
CREATE INDEX idx_inspections_project ON inspections(project_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_scheduled ON inspections(scheduled_date);
CREATE INDEX idx_inspection_items_inspection ON inspection_items(inspection_id);

-- ============================================================
-- FEATURE 6: CLIENT PORTAL
-- ============================================================

CREATE TABLE portal_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT,
  magic_link_token TEXT,
  magic_link_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, organization_id)
);

CREATE TABLE portal_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  portal_user_id UUID REFERENCES portal_users(id),
  staff_user_id UUID REFERENCES profiles(id),
  direction portal_message_direction NOT NULL,
  body TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portal_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portal_user_id UUID NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add client_signature_url to change_orders
ALTER TABLE change_orders ADD COLUMN IF NOT EXISTS client_signature_url TEXT;

CREATE INDEX idx_portal_users_customer ON portal_users(customer_id);
CREATE INDEX idx_portal_users_email ON portal_users(email);
CREATE INDEX idx_portal_messages_project ON portal_messages(project_id);
CREATE INDEX idx_portal_activity_log_user ON portal_activity_log(portal_user_id);

-- ============================================================
-- SEED: System Inspection Templates
-- ============================================================

INSERT INTO inspection_templates (name, description, trade, category, is_system, is_active) VALUES
  ('Pre-Drywall Inspection', 'Inspect framing, electrical, plumbing, and HVAC before drywall installation', 'general_contractor', 'quality', TRUE, TRUE),
  ('Roof Final Inspection', 'Final inspection of completed roofing installation', 'roofing', 'quality', TRUE, TRUE),
  ('OSHA Safety Checklist', 'General OSHA compliance safety inspection for job sites', NULL, 'safety', TRUE, TRUE),
  ('Electrical Rough-In', 'Inspect electrical wiring, boxes, and panels before cover', 'electrical', 'quality', TRUE, TRUE),
  ('Plumbing Pressure Test', 'Water supply and DWV pressure testing', 'plumbing', 'quality', TRUE, TRUE),
  ('HVAC Ductwork Inspection', 'Inspect ductwork installation and sealing', 'hvac', 'quality', TRUE, TRUE),
  ('Foundation Inspection', 'Pre-pour inspection of foundation forms, rebar, and drainage', 'general_contractor', 'quality', TRUE, TRUE),
  ('Fire Safety Inspection', 'Fire extinguisher, exit, and alarm system check', NULL, 'safety', TRUE, TRUE),
  ('Equipment Safety Check', 'Pre-use safety inspection for heavy equipment', NULL, 'safety', TRUE, TRUE),
  ('Final Walkthrough', 'Client walkthrough punch list and completion verification', NULL, 'quality', TRUE, TRUE),
  ('Insulation Inspection', 'Verify insulation type, R-value, and installation quality', 'insulation', 'quality', TRUE, TRUE),
  ('Concrete Pour Checklist', 'Pre-pour, during pour, and finishing checklist', 'concrete', 'quality', TRUE, TRUE);

-- Seed template sections and items for OSHA Safety Checklist
DO $$
DECLARE
  v_template_id UUID;
  v_section_ppe UUID;
  v_section_fall UUID;
  v_section_electrical UUID;
  v_section_housekeeping UUID;
BEGIN
  SELECT id INTO v_template_id FROM inspection_templates WHERE name = 'OSHA Safety Checklist' AND is_system = TRUE LIMIT 1;

  INSERT INTO template_sections (template_id, name, order_index) VALUES
    (v_template_id, 'Personal Protective Equipment', 0) RETURNING id INTO v_section_ppe;
  INSERT INTO template_sections (template_id, name, order_index) VALUES
    (v_template_id, 'Fall Protection', 1) RETURNING id INTO v_section_fall;
  INSERT INTO template_sections (template_id, name, order_index) VALUES
    (v_template_id, 'Electrical Safety', 2) RETURNING id INTO v_section_electrical;
  INSERT INTO template_sections (template_id, name, order_index) VALUES
    (v_template_id, 'Housekeeping', 3) RETURNING id INTO v_section_housekeeping;

  -- PPE items
  INSERT INTO template_items (template_id, section_id, label, type, is_required, order_index) VALUES
    (v_template_id, v_section_ppe, 'Hard hats worn by all workers', 'pass_fail', TRUE, 0),
    (v_template_id, v_section_ppe, 'Safety glasses/goggles available and worn', 'pass_fail', TRUE, 1),
    (v_template_id, v_section_ppe, 'High-visibility vests worn', 'pass_fail', TRUE, 2),
    (v_template_id, v_section_ppe, 'Steel-toe boots worn by all workers', 'pass_fail', TRUE, 3),
    (v_template_id, v_section_ppe, 'Hearing protection available where needed', 'pass_fail', FALSE, 4),
    (v_template_id, v_section_ppe, 'Gloves appropriate for task', 'pass_fail', FALSE, 5);

  -- Fall Protection items
  INSERT INTO template_items (template_id, section_id, label, type, is_required, order_index) VALUES
    (v_template_id, v_section_fall, 'Guardrails installed at 6ft+ elevations', 'pass_fail', TRUE, 0),
    (v_template_id, v_section_fall, 'Harness and lanyard inspection current', 'pass_fail', TRUE, 1),
    (v_template_id, v_section_fall, 'Ladder secured and in good condition', 'pass_fail', TRUE, 2),
    (v_template_id, v_section_fall, 'Scaffolding properly erected and inspected', 'pass_fail', FALSE, 3),
    (v_template_id, v_section_fall, 'Floor/wall openings covered or guarded', 'pass_fail', TRUE, 4);

  -- Electrical Safety items
  INSERT INTO template_items (template_id, section_id, label, type, is_required, order_index) VALUES
    (v_template_id, v_section_electrical, 'GFCI protection on all temporary power', 'pass_fail', TRUE, 0),
    (v_template_id, v_section_electrical, 'Extension cords in good condition', 'pass_fail', TRUE, 1),
    (v_template_id, v_section_electrical, 'Lockout/tagout procedures followed', 'pass_fail', TRUE, 2),
    (v_template_id, v_section_electrical, 'Electrical panels accessible and labeled', 'pass_fail', FALSE, 3);

  -- Housekeeping items
  INSERT INTO template_items (template_id, section_id, label, type, is_required, order_index) VALUES
    (v_template_id, v_section_housekeeping, 'Work area clean and organized', 'pass_fail', TRUE, 0),
    (v_template_id, v_section_housekeeping, 'Trash and debris removed regularly', 'pass_fail', TRUE, 1),
    (v_template_id, v_section_housekeeping, 'Materials stored properly', 'pass_fail', FALSE, 2),
    (v_template_id, v_section_housekeeping, 'Fire extinguisher accessible and charged', 'pass_fail', TRUE, 3),
    (v_template_id, v_section_housekeeping, 'First aid kit stocked and accessible', 'pass_fail', TRUE, 4),
    (v_template_id, v_section_housekeeping, 'Emergency exits clear and marked', 'pass_fail', TRUE, 5);
END $$;

-- Seed template sections and items for Roof Final Inspection
DO $$
DECLARE
  v_template_id UUID;
  v_section_materials UUID;
  v_section_install UUID;
  v_section_flashing UUID;
  v_section_cleanup UUID;
BEGIN
  SELECT id INTO v_template_id FROM inspection_templates WHERE name = 'Roof Final Inspection' AND is_system = TRUE LIMIT 1;

  INSERT INTO template_sections (template_id, name, order_index) VALUES
    (v_template_id, 'Materials Verification', 0) RETURNING id INTO v_section_materials;
  INSERT INTO template_sections (template_id, name, order_index) VALUES
    (v_template_id, 'Installation Quality', 1) RETURNING id INTO v_section_install;
  INSERT INTO template_sections (template_id, name, order_index) VALUES
    (v_template_id, 'Flashing & Penetrations', 2) RETURNING id INTO v_section_flashing;
  INSERT INTO template_sections (template_id, name, order_index) VALUES
    (v_template_id, 'Cleanup & Final', 3) RETURNING id INTO v_section_cleanup;

  INSERT INTO template_items (template_id, section_id, label, type, is_required, order_index) VALUES
    (v_template_id, v_section_materials, 'Shingle/material brand matches specification', 'pass_fail', TRUE, 0),
    (v_template_id, v_section_materials, 'Underlayment properly installed', 'pass_fail', TRUE, 1),
    (v_template_id, v_section_materials, 'Starter strip installed at eaves and rakes', 'pass_fail', TRUE, 2),
    (v_template_id, v_section_materials, 'Ice and water shield at valleys and eaves', 'pass_fail', TRUE, 3);

  INSERT INTO template_items (template_id, section_id, label, type, is_required, order_index) VALUES
    (v_template_id, v_section_install, 'Shingles aligned and properly nailed', 'pass_fail', TRUE, 0),
    (v_template_id, v_section_install, 'Ridge cap properly installed', 'pass_fail', TRUE, 1),
    (v_template_id, v_section_install, 'Ventilation adequate (ridge vent, soffit vents)', 'pass_fail', TRUE, 2),
    (v_template_id, v_section_install, 'Hip and valley lines straight', 'pass_fail', TRUE, 3),
    (v_template_id, v_section_install, 'No exposed nails visible', 'pass_fail', TRUE, 4);

  INSERT INTO template_items (template_id, section_id, label, type, is_required, order_index) VALUES
    (v_template_id, v_section_flashing, 'Chimney flashing sealed and counter-flashed', 'pass_fail', FALSE, 0),
    (v_template_id, v_section_flashing, 'Pipe boots/vent flashing properly installed', 'pass_fail', TRUE, 1),
    (v_template_id, v_section_flashing, 'Wall flashing step and counter-flashing', 'pass_fail', FALSE, 2),
    (v_template_id, v_section_flashing, 'Drip edge installed at eaves and rakes', 'pass_fail', TRUE, 3);

  INSERT INTO template_items (template_id, section_id, label, type, is_required, order_index) VALUES
    (v_template_id, v_section_cleanup, 'All debris removed from roof and ground', 'pass_fail', TRUE, 0),
    (v_template_id, v_section_cleanup, 'Gutters cleaned and functional', 'pass_fail', TRUE, 1),
    (v_template_id, v_section_cleanup, 'Magnetic nail sweep completed', 'pass_fail', TRUE, 2),
    (v_template_id, v_section_cleanup, 'Before/after photos taken', 'photo', TRUE, 3),
    (v_template_id, v_section_cleanup, 'Customer walkthrough notes', 'text', FALSE, 4);
END $$;
