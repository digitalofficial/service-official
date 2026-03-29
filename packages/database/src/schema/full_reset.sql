-- ============================================================
-- SERVICE OFFICIAL — FULL RESET
-- Drops everything, recreates schema, RLS, and seeds demo data
-- Run this in Supabase SQL Editor as a single script
-- ============================================================

-- ============================================================
-- STEP 1: NUKE EVERYTHING
-- ============================================================

DROP TABLE IF EXISTS automation_logs CASCADE;
DROP TABLE IF EXISTS automation_rules CASCADE;
DROP TABLE IF EXISTS report_snapshots CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS job_reminders CASCADE;
DROP TABLE IF EXISTS organization_sms_settings CASCADE;
DROP TABLE IF EXISTS organization_domains CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS takeoff_items CASCADE;
DROP TABLE IF EXISTS takeoffs CASCADE;
DROP TABLE IF EXISTS blueprint_sheets CASCADE;
DROP TABLE IF EXISTS blueprints CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS estimate_line_items CASCADE;
DROP TABLE IF EXISTS estimate_sections CASCADE;
DROP TABLE IF EXISTS estimates CASCADE;
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS project_materials CASCADE;
DROP TABLE IF EXISTS material_catalog CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS punch_list_items CASCADE;
DROP TABLE IF EXISTS rfis CASCADE;
DROP TABLE IF EXISTS change_orders CASCADE;
DROP TABLE IF EXISTS submittals CASCADE;
DROP TABLE IF EXISTS project_subcontractors CASCADE;
DROP TABLE IF EXISTS subcontractors CASCADE;
DROP TABLE IF EXISTS project_team CASCADE;
DROP TABLE IF EXISTS project_milestones CASCADE;
DROP TABLE IF EXISTS project_phases CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

DROP TYPE IF EXISTS industry_type CASCADE;
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;
DROP TYPE IF EXISTS estimate_status CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS expense_category CASCADE;
DROP TYPE IF EXISTS file_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS message_channel CASCADE;
DROP TYPE IF EXISTS message_direction CASCADE;
DROP TYPE IF EXISTS phase_status CASCADE;
DROP TYPE IF EXISTS milestone_status CASCADE;
DROP TYPE IF EXISTS rfi_status CASCADE;
DROP TYPE IF EXISTS change_order_status CASCADE;
DROP TYPE IF EXISTS submittal_status CASCADE;
DROP TYPE IF EXISTS takeoff_status CASCADE;
DROP TYPE IF EXISTS weather_condition CASCADE;

DROP FUNCTION IF EXISTS public.get_org_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- ============================================================
-- STEP 2: EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- STEP 3: ENUMS
-- ============================================================

CREATE TYPE industry_type AS ENUM (
  'roofing', 'general_contractor', 'electrical', 'plumbing', 'hvac',
  'landscaping', 'painting', 'flooring', 'concrete', 'masonry',
  'framing', 'insulation', 'windows_doors', 'solar', 'other'
);

CREATE TYPE subscription_tier AS ENUM ('solo', 'team', 'growth', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'paused');

CREATE TYPE user_role AS ENUM (
  'owner', 'admin', 'office_manager', 'estimator',
  'project_manager', 'foreman', 'technician', 'dispatcher',
  'subcontractor', 'viewer'
);

CREATE TYPE project_status AS ENUM (
  'lead', 'estimating', 'proposal_sent', 'approved', 'in_progress',
  'on_hold', 'punch_list', 'completed', 'invoiced', 'paid', 'canceled', 'warranty'
);

CREATE TYPE job_status AS ENUM (
  'unscheduled', 'scheduled', 'en_route', 'on_site', 'in_progress',
  'completed', 'needs_follow_up', 'canceled'
);

CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'qualified', 'proposal', 'negotiating',
  'won', 'lost', 'unqualified'
);

CREATE TYPE estimate_status AS ENUM (
  'draft', 'sent', 'viewed', 'approved', 'declined', 'expired', 'converted'
);

CREATE TYPE invoice_status AS ENUM (
  'draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'voided', 'refunded'
);

CREATE TYPE payment_method AS ENUM ('card', 'ach', 'check', 'cash', 'zelle', 'venmo', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');

CREATE TYPE expense_category AS ENUM (
  'materials', 'labor', 'equipment', 'fuel', 'permits', 'subcontractor',
  'tools', 'dump_fees', 'insurance', 'overhead', 'other'
);

CREATE TYPE file_type AS ENUM (
  'image', 'pdf', 'blueprint', 'contract', 'permit', 'inspection',
  'warranty', 'invoice', 'estimate', 'material_list', 'safety', 'other'
);

CREATE TYPE notification_type AS ENUM (
  'job_assigned', 'job_status_update', 'estimate_approved', 'estimate_declined',
  'invoice_paid', 'invoice_overdue', 'message_received', 'project_update',
  'timeline_milestone', 'expense_submitted', 'rfi_submitted', 'change_order_approved',
  'weather_alert', 'safety_incident', 'inspection_scheduled', 'payment_received',
  'client_message', 'task_assigned', 'task_overdue', 'document_uploaded'
);

CREATE TYPE message_channel AS ENUM ('sms', 'email', 'in_app', 'push');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');

CREATE TYPE phase_status AS ENUM ('not_started', 'in_progress', 'completed', 'on_hold');
CREATE TYPE milestone_status AS ENUM ('pending', 'in_progress', 'completed', 'missed');

CREATE TYPE rfi_status AS ENUM ('open', 'submitted', 'under_review', 'answered', 'closed');
CREATE TYPE change_order_status AS ENUM ('draft', 'submitted', 'approved', 'declined', 'void');
CREATE TYPE submittal_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'resubmit');

CREATE TYPE takeoff_status AS ENUM ('pending', 'processing', 'review', 'approved', 'exported');
CREATE TYPE weather_condition AS ENUM ('clear', 'partly_cloudy', 'cloudy', 'rain', 'heavy_rain', 'snow', 'wind', 'storm');

-- ============================================================
-- STEP 4: TABLES
-- ============================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry industry_type NOT NULL DEFAULT 'general_contractor',
  logo_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  timezone TEXT DEFAULT 'America/New_York',
  currency TEXT DEFAULT 'USD',
  license_number TEXT,
  insurance_number TEXT,
  tax_id TEXT,
  primary_color TEXT DEFAULT '#0066FF',
  secondary_color TEXT DEFAULT '#1A1A2E',
  settings JSONB DEFAULT '{}',
  subscription_tier subscription_tier DEFAULT 'solo',
  subscription_status subscription_status DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'technician',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  title TEXT,
  employee_id TEXT,
  hourly_rate DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT TRUE,
  notify_push BOOLEAN DEFAULT TRUE,
  last_location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'residential' CHECK (type IN ('residential', 'commercial', 'property_manager', 'hoa', 'government')),
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  email TEXT,
  email_secondary TEXT,
  phone TEXT,
  phone_secondary TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  billing_same_as_service BOOLEAN DEFAULT TRUE,
  billing_address JSONB,
  tags TEXT[] DEFAULT '{}',
  source TEXT,
  notes TEXT,
  internal_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  portal_access BOOLEAN DEFAULT FALSE,
  portal_token TEXT UNIQUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  status lead_status DEFAULT 'new',
  title TEXT NOT NULL,
  description TEXT,
  estimated_value DECIMAL(10,2),
  source TEXT,
  source_detail TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  assigned_to UUID REFERENCES profiles(id),
  follow_up_date TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  project_number TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status project_status DEFAULT 'estimating',
  industry industry_type,
  type TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  coordinates JSONB,
  contract_value DECIMAL(12,2),
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2) DEFAULT 0,
  profit_margin DECIMAL(5,2),
  estimated_start_date DATE,
  estimated_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  project_manager_id UUID REFERENCES profiles(id),
  foreman_id UUID REFERENCES profiles(id),
  roof_type TEXT,
  roof_slope TEXT,
  roof_squares DECIMAL(8,2),
  permit_number TEXT,
  permit_issued_date DATE,
  permit_expiry_date DATE,
  inspection_required BOOLEAN DEFAULT FALSE,
  client_portal_enabled BOOLEAN DEFAULT FALSE,
  client_can_message BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  internal_notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status phase_status DEFAULT 'not_started',
  order_index INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  actual_start DATE,
  actual_end DATE,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES project_phases(id),
  name TEXT NOT NULL,
  description TEXT,
  status milestone_status DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notify_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT,
  hourly_rate DECIMAL(10,2),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  UNIQUE(project_id, user_id)
);

CREATE TABLE subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  trade TEXT,
  license_number TEXT,
  insurance_expiry DATE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  subcontractor_id UUID NOT NULL REFERENCES subcontractors(id),
  scope TEXT,
  contract_amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  customer_id UUID REFERENCES customers(id),
  job_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status job_status DEFAULT 'unscheduled',
  type TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  duration_minutes INTEGER,
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  coordinates JSONB,
  assigned_to UUID REFERENCES profiles(id),
  instructions TEXT,
  completion_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  estimate_id UUID,
  invoice_id UUID,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type file_type DEFAULT 'other',
  mime_type TEXT,
  size_bytes BIGINT,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  thumbnail_url TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES project_phases(id),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  taken_at TIMESTAMPTZ,
  location JSONB,
  tags TEXT[] DEFAULT '{}',
  is_before BOOLEAN,
  is_after BOOLEAN,
  is_public BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0',
  discipline TEXT,
  scale TEXT,
  file_id UUID REFERENCES files(id),
  storage_path TEXT,
  public_url TEXT,
  page_count INTEGER,
  is_processed BOOLEAN DEFAULT FALSE,
  processing_status TEXT DEFAULT 'pending',
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blueprint_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  title TEXT,
  sheet_number TEXT,
  discipline TEXT,
  scale TEXT,
  width_px INTEGER,
  height_px INTEGER,
  thumbnail_url TEXT,
  public_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE takeoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  blueprint_id UUID REFERENCES blueprints(id),
  estimate_id UUID,
  name TEXT NOT NULL,
  trade TEXT,
  status takeoff_status DEFAULT 'pending',
  ai_model TEXT,
  ai_confidence DECIMAL(5,2),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE takeoff_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  takeoff_id UUID NOT NULL REFERENCES takeoffs(id) ON DELETE CASCADE,
  sheet_id UUID REFERENCES blueprint_sheets(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity DECIMAL(12,4),
  unit TEXT,
  ai_quantity DECIMAL(12,4),
  confidence_score DECIMAL(5,2),
  formula_used TEXT,
  source_coordinates JSONB,
  is_reviewed BOOLEAN DEFAULT FALSE,
  is_overridden BOOLEAN DEFAULT FALSE,
  override_quantity DECIMAL(12,4),
  override_reason TEXT,
  material_id UUID,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  customer_id UUID REFERENCES customers(id),
  takeoff_id UUID REFERENCES takeoffs(id),
  estimate_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status estimate_status DEFAULT 'draft',
  issue_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  approved_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  signature_url TEXT,
  signed_at TIMESTAMPTZ,
  signed_by_name TEXT,
  signed_by_ip TEXT,
  viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE estimate_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE estimate_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  section_id UUID REFERENCES estimate_sections(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity DECIMAL(12,4) DEFAULT 1,
  unit TEXT,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  markup_percent DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  material_id UUID,
  takeoff_item_id UUID REFERENCES takeoff_items(id),
  order_index INTEGER DEFAULT 0,
  is_optional BOOLEAN DEFAULT FALSE,
  is_taxable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  customer_id UUID REFERENCES customers(id),
  estimate_id UUID REFERENCES estimates(id),
  invoice_number TEXT,
  title TEXT,
  status invoice_status DEFAULT 'draft',
  type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'progress', 'deposit', 'final', 'credit')),
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  amount_due DECIMAL(12,2) DEFAULT 0,
  terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  reminder_sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(12,4) DEFAULT 1,
  unit TEXT,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  is_taxable BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  customer_id UUID REFERENCES customers(id),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  method payment_method,
  status payment_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  reference TEXT,
  notes TEXT,
  refunded_amount DECIMAL(12,2) DEFAULT 0,
  refunded_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  title TEXT NOT NULL,
  description TEXT,
  category expense_category DEFAULT 'other',
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  vendor_name TEXT,
  vendor_invoice_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
  is_billable BOOLEAN DEFAULT FALSE,
  is_reimbursable BOOLEAN DEFAULT FALSE,
  receipt_file_id UUID REFERENCES files(id),
  expense_date DATE DEFAULT CURRENT_DATE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  submitted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE material_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  category TEXT,
  trade TEXT,
  unit TEXT,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  markup_percent DECIMAL(5,2) DEFAULT 0,
  supplier TEXT,
  supplier_sku TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_id UUID REFERENCES material_catalog(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity_estimated DECIMAL(12,4),
  quantity_ordered DECIMAL(12,4) DEFAULT 0,
  quantity_received DECIMAL(12,4) DEFAULT 0,
  quantity_used DECIMAL(12,4) DEFAULT 0,
  unit TEXT,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'partial', 'received', 'installed')),
  supplier TEXT,
  po_number TEXT,
  ordered_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  weather weather_condition,
  temperature_high INTEGER,
  temperature_low INTEGER,
  wind_speed INTEGER,
  precipitation BOOLEAN DEFAULT FALSE,
  weather_delay BOOLEAN DEFAULT FALSE,
  weather_delay_hours DECIMAL(4,2),
  work_performed TEXT NOT NULL,
  areas_worked TEXT,
  crew_count INTEGER,
  crew_hours DECIMAL(6,2),
  visitors TEXT,
  inspectors TEXT,
  safety_incidents TEXT,
  issues TEXT,
  photos_attached BOOLEAN DEFAULT FALSE,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, log_date)
);

CREATE TABLE punch_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES project_phases(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'void')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  assigned_to UUID REFERENCES profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  photo_id UUID REFERENCES photos(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rfis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rfi_number TEXT,
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  status rfi_status DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  discipline TEXT,
  due_date DATE,
  answered_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  answered_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  co_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status change_order_status DEFAULT 'draft',
  reason TEXT,
  amount DECIMAL(12,2) DEFAULT 0,
  approved_amount DECIMAL(12,2),
  schedule_days_impact INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submittals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  submittal_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status submittal_status DEFAULT 'draft',
  spec_section TEXT,
  due_date DATE,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  project_id UUID REFERENCES projects(id),
  channel message_channel NOT NULL,
  phone_number TEXT,
  email_address TEXT,
  subject TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  direction message_direction NOT NULL,
  channel message_channel NOT NULL,
  body TEXT NOT NULL,
  twilio_sid TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  media_urls TEXT[] DEFAULT '{}',
  sent_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  channels message_channel[] DEFAULT '{in_app}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  trigger_event TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB NOT NULL,
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  triggered_by TEXT,
  entity_type TEXT,
  entity_id UUID,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  actions_executed JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE report_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 5: INDEXES
-- ============================================================

CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_pm ON projects(project_manager_id);

CREATE INDEX idx_jobs_org ON jobs(organization_id);
CREATE INDEX idx_jobs_project ON jobs(project_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_assigned ON jobs(assigned_to);
CREATE INDEX idx_jobs_schedule ON jobs(scheduled_start);

CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_email ON customers(email);

CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);

CREATE INDEX idx_estimates_org ON estimates(organization_id);
CREATE INDEX idx_estimates_status ON estimates(status);

CREATE INDEX idx_expenses_project ON expenses(project_id);
CREATE INDEX idx_materials_project ON project_materials(project_id);

CREATE INDEX idx_files_project ON files(project_id);
CREATE INDEX idx_photos_project ON photos(project_id);
CREATE INDEX idx_blueprints_project ON blueprints(project_id);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_audit_org ON audit_logs(organization_id, created_at DESC);

-- ============================================================
-- STEP 6: ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 7: UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations', 'profiles', 'customers', 'leads', 'projects',
    'project_phases', 'project_milestones', 'jobs', 'estimates',
    'estimate_line_items', 'invoices', 'invoice_line_items', 'payments',
    'expenses', 'files', 'blueprints', 'takeoffs', 'takeoff_items',
    'project_materials', 'material_catalog', 'punch_list_items',
    'rfis', 'change_orders', 'submittals', 'automation_rules', 'subcontractors'
  ]
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', t);
  END LOOP;
END;
$$;

-- ============================================================
-- STEP 8: RLS POLICIES (org isolation)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  organization_id = public.get_org_id() OR id = auth.uid()
);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (
  id = auth.uid()
);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  id = auth.uid() OR organization_id = public.get_org_id()
);

-- Organizations
CREATE POLICY "org_select" ON organizations FOR SELECT USING (
  id = public.get_org_id() OR id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "org_update" ON organizations FOR UPDATE USING (
  id = public.get_org_id()
);
CREATE POLICY "org_insert" ON organizations FOR INSERT WITH CHECK (true);

-- Customers
CREATE POLICY "customers_select" ON customers FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (organization_id = public.get_org_id());
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (organization_id = public.get_org_id());

-- Projects
CREATE POLICY "projects_select" ON projects FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (organization_id = public.get_org_id());
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (organization_id = public.get_org_id());

-- Leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_select" ON leads FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "leads_insert" ON leads FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "leads_update" ON leads FOR UPDATE USING (organization_id = public.get_org_id());
CREATE POLICY "leads_delete" ON leads FOR DELETE USING (organization_id = public.get_org_id());

-- Jobs
CREATE POLICY "jobs_select" ON jobs FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "jobs_insert" ON jobs FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "jobs_update" ON jobs FOR UPDATE USING (organization_id = public.get_org_id());
CREATE POLICY "jobs_delete" ON jobs FOR DELETE USING (organization_id = public.get_org_id());

-- Estimates
CREATE POLICY "estimates_select" ON estimates FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "estimates_insert" ON estimates FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "estimates_update" ON estimates FOR UPDATE USING (organization_id = public.get_org_id());

-- Invoices
CREATE POLICY "invoices_select" ON invoices FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "invoices_insert" ON invoices FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "invoices_update" ON invoices FOR UPDATE USING (organization_id = public.get_org_id());

-- Payments
CREATE POLICY "payments_select" ON payments FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- Expenses
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (organization_id = public.get_org_id());

-- Files
CREATE POLICY "files_select" ON files FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "files_insert" ON files FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "files_delete" ON files FOR DELETE USING (organization_id = public.get_org_id());

-- Photos
CREATE POLICY "photos_select" ON photos FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "photos_insert" ON photos FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- Notifications
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Messages
CREATE POLICY "messages_select" ON messages FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- Project-scoped tables (RLS via parent project)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'project_phases', 'project_milestones', 'project_team',
    'project_materials', 'daily_logs', 'punch_list_items',
    'rfis', 'change_orders', 'submittals'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('
      CREATE POLICY "%1$s_select" ON %1$I FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE organization_id = public.get_org_id())
      )', t);
    EXECUTE format('
      CREATE POLICY "%1$s_insert" ON %1$I FOR INSERT WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE organization_id = public.get_org_id())
      )', t);
    EXECUTE format('
      CREATE POLICY "%1$s_update" ON %1$I FOR UPDATE USING (
        project_id IN (SELECT id FROM projects WHERE organization_id = public.get_org_id())
      )', t);
  END LOOP;
END;
$$;

-- Estimate sections/line items
ALTER TABLE estimate_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "est_sections_select" ON estimate_sections FOR SELECT USING (
  estimate_id IN (SELECT id FROM estimates WHERE organization_id = public.get_org_id())
);
CREATE POLICY "est_sections_insert" ON estimate_sections FOR INSERT WITH CHECK (
  estimate_id IN (SELECT id FROM estimates WHERE organization_id = public.get_org_id())
);
CREATE POLICY "est_items_select" ON estimate_line_items FOR SELECT USING (
  estimate_id IN (SELECT id FROM estimates WHERE organization_id = public.get_org_id())
);
CREATE POLICY "est_items_insert" ON estimate_line_items FOR INSERT WITH CHECK (
  estimate_id IN (SELECT id FROM estimates WHERE organization_id = public.get_org_id())
);

-- Invoice line items
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_items_select" ON invoice_line_items FOR SELECT USING (
  invoice_id IN (SELECT id FROM invoices WHERE organization_id = public.get_org_id())
);
CREATE POLICY "inv_items_insert" ON invoice_line_items FOR INSERT WITH CHECK (
  invoice_id IN (SELECT id FROM invoices WHERE organization_id = public.get_org_id())
);

-- Blueprints, takeoffs
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE takeoff_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blueprints_select" ON blueprints FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "blueprints_insert" ON blueprints FOR INSERT WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "bp_sheets_select" ON blueprint_sheets FOR SELECT USING (
  blueprint_id IN (SELECT id FROM blueprints WHERE organization_id = public.get_org_id())
);

CREATE POLICY "takeoffs_select" ON takeoffs FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "takeoffs_insert" ON takeoffs FOR INSERT WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "takeoff_items_select" ON takeoff_items FOR SELECT USING (
  takeoff_id IN (SELECT id FROM takeoffs WHERE organization_id = public.get_org_id())
);

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- Automation
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_select" ON automation_rules FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "automation_insert" ON automation_rules FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "automation_update" ON automation_rules FOR UPDATE USING (organization_id = public.get_org_id());

CREATE POLICY "automation_logs_select" ON automation_logs FOR SELECT USING (
  rule_id IN (SELECT id FROM automation_rules WHERE organization_id = public.get_org_id())
);

-- Material catalog
ALTER TABLE material_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog_select" ON material_catalog FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "catalog_insert" ON material_catalog FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- Subcontractors
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_select" ON subcontractors FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "subs_insert" ON subcontractors FOR INSERT WITH CHECK (organization_id = public.get_org_id());

-- Audit logs, report snapshots
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select" ON audit_logs FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "reports_select" ON report_snapshots FOR SELECT USING (organization_id = public.get_org_id());

-- ============================================================
-- STEP 9: ORGANIZATION DOMAINS
-- ============================================================

CREATE TABLE organization_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_domains_domain ON organization_domains(domain);

ALTER TABLE organization_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_domains_select" ON organization_domains FOR SELECT USING (
  organization_id = public.get_org_id()
);
CREATE POLICY "org_domains_insert" ON organization_domains FOR INSERT WITH CHECK (
  organization_id = public.get_org_id()
);

-- ============================================================
-- STEP 10: INVITATIONS
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
CREATE POLICY "invitations_select_by_token" ON invitations FOR SELECT USING (
  token IS NOT NULL
);

-- ============================================================
-- STEP 11: SMS SETTINGS & JOB REMINDERS
-- ============================================================

CREATE TABLE organization_sms_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  default_reminder_1 INTERVAL DEFAULT '1 day',
  default_reminder_2 INTERVAL DEFAULT '1 hour',
  send_assignment_sms BOOLEAN DEFAULT TRUE,
  send_completion_sms BOOLEAN DEFAULT FALSE,
  notify_customer_booked BOOLEAN DEFAULT TRUE,
  notify_customer_en_route BOOLEAN DEFAULT TRUE,
  notify_customer_completed BOOLEAN DEFAULT FALSE,
  google_maps_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organization_sms_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sms_settings_select" ON organization_sms_settings FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "sms_settings_upsert" ON organization_sms_settings FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "sms_settings_update" ON organization_sms_settings FOR UPDATE USING (organization_id = public.get_org_id());

CREATE TABLE job_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('1_day', '1_hour', '30_min', '15_min', 'custom', 'assignment')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'canceled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  phone_number TEXT NOT NULL,
  message_body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_reminders_pending ON job_reminders(remind_at, status) WHERE status = 'pending';
CREATE INDEX idx_job_reminders_job ON job_reminders(job_id);

ALTER TABLE job_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_reminders_select" ON job_reminders FOR SELECT USING (organization_id = public.get_org_id());
CREATE POLICY "job_reminders_insert" ON job_reminders FOR INSERT WITH CHECK (organization_id = public.get_org_id());
CREATE POLICY "job_reminders_update" ON job_reminders FOR UPDATE USING (organization_id = public.get_org_id());

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON organization_sms_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STEP 12: SEED — Platinum Builders org + Tucson demo jobs
-- ============================================================

-- Create the Platinum Builders organization
INSERT INTO organizations (name, slug, industry, phone, email, address_line1, city, state, zip, timezone, primary_color, subscription_tier, subscription_status)
VALUES ('Platinum Builders LLC', 'platinum-builders', 'general_contractor', '520-555-0100', 'info@platinumbuildersllc.com', '2600 N Tucson Blvd', 'Tucson', 'AZ', '85716', 'America/Phoenix', '#1A1A2E', 'growth', 'active');

-- Seed domains
INSERT INTO organization_domains (organization_id, domain, is_primary, is_verified, verified_at)
SELECT id, 'service.platinumbuildersllc.com', true, true, NOW()
FROM organizations WHERE slug = 'platinum-builders';

-- Seed sample jobs (profile will be linked when first user signs up and joins this org)
-- For now, insert jobs without assigned_to/created_by since no profiles exist yet
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'platinum-builders';

  INSERT INTO jobs (organization_id, job_number, title, description, status, priority, scheduled_start, scheduled_end, address_line1, city, state, zip, coordinates, instructions) VALUES

  -- Scheduled jobs
  (v_org_id, 'JOB-1001', 'Roof Inspection — Grant Rd Office', 'Full roof inspection for commercial office building. Check for storm damage and drainage issues.', 'scheduled', 'high',
   NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 3 hours',
   '4001 E Grant Rd', 'Tucson', 'AZ', '85712',
   '{"lat": 32.2530, "lng": -110.9127}',
   'Access via rear parking lot. Ask for building manager Jose.'),

  (v_org_id, 'JOB-1002', 'Tile Roof Repair — Catalina Foothills', 'Replace cracked tiles on south-facing slope. Customer reported leak in master bedroom.', 'scheduled', 'urgent',
   NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 4 hours',
   '6320 N Campbell Ave', 'Tucson', 'AZ', '85718',
   '{"lat": 32.2870, "lng": -110.9420}',
   'Gated community — code is #4521. Park on street.'),

  (v_org_id, 'JOB-1003', 'Flat Roof Coating — Speedway Plaza', 'Apply elastomeric roof coating to 3,200 sq ft flat roof. Prep and seal all penetrations.', 'scheduled', 'normal',
   NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 6 hours',
   '2910 E Speedway Blvd', 'Tucson', 'AZ', '85716',
   '{"lat": 32.2364, "lng": -110.9387}',
   'Coordinate with tenant — restaurant below. Start early before it gets hot.'),

  -- In Progress
  (v_org_id, 'JOB-1004', 'Re-Roof — Rita Ranch Residence', 'Full tear-off and re-roof with 30-year architectural shingles. 2,800 sq ft.', 'in_progress', 'high',
   NOW() - INTERVAL '4 hours', NOW() + INTERVAL '2 days',
   '10450 E Rita Rd', 'Tucson', 'AZ', '85747',
   '{"lat": 32.1047, "lng": -110.8133}',
   'Dumpster is in driveway. Tarps on landscaping.'),

  (v_org_id, 'JOB-1005', 'Skylight Install — Oro Valley Home', 'Install two Velux skylights in kitchen area. Cut, frame, flash, and finish.', 'in_progress', 'normal',
   NOW() - INTERVAL '2 hours', NOW() + INTERVAL '1 day',
   '1255 W Magee Rd', 'Tucson', 'AZ', '85704',
   '{"lat": 32.3390, "lng": -110.9912}',
   'Materials staged in garage. Homeowner is home all day.'),

  -- Completed
  (v_org_id, 'JOB-1006', 'Gutter Installation — Marana', 'Install 6" seamless aluminum gutters with downspouts on all four sides.', 'completed', 'normal',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '5 hours',
   '8370 N Cortaro Rd', 'Tucson', 'AZ', '85743',
   '{"lat": 32.3530, "lng": -111.1190}',
   'Completed. Customer signed off. Invoice pending.'),

  (v_org_id, 'JOB-1007', 'Emergency Tarp — Monsoon Damage', 'Emergency tarp placement after monsoon blew off ridge cap tiles.', 'completed', 'urgent',
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
   '3640 S 12th Ave', 'Tucson', 'AZ', '85713',
   '{"lat": 32.1950, "lng": -110.9720}',
   'Tarp secured. Follow-up repair needed — see JOB-1010.'),

  -- Unscheduled
  (v_org_id, 'JOB-1008', 'Roof Estimate — Broadway Village', 'Provide estimate for full commercial re-roof. TPO single-ply system.', 'unscheduled', 'normal',
   NULL, NULL,
   '16 S Eastbourne Ave', 'Tucson', 'AZ', '85716',
   '{"lat": 32.2193, "lng": -110.9490}',
   'Contact property manager Maria to schedule walkthrough.'),

  (v_org_id, 'JOB-1009', 'Solar Panel Removal & Re-Roof', 'Remove 24 solar panels, re-roof, reinstall panels. Coordinate with solar company.', 'unscheduled', 'high',
   NULL, NULL,
   '5775 E River Rd', 'Tucson', 'AZ', '85750',
   '{"lat": 32.3270, "lng": -110.8750}',
   'Solar company: SunTech AZ, contact Mike at 520-555-0199.'),

  -- Needs Follow Up
  (v_org_id, 'JOB-1010', 'Follow-Up Repair — 12th Ave Monsoon', 'Permanent repair for ridge cap tiles blown off during monsoon. Follow-up to JOB-1007.', 'needs_follow_up', 'high',
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '3 hours',
   '3640 S 12th Ave', 'Tucson', 'AZ', '85713',
   '{"lat": 32.1950, "lng": -110.9720}',
   'Need to order matching tiles before scheduling. Customer waiting on insurance approval.'),

  (v_org_id, 'JOB-1011', 'Leak Investigation — Downtown Loft', 'Water stain appeared on ceiling after rain. Need to locate source and assess damage.', 'needs_follow_up', 'urgent',
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '2 hours',
   '100 E Congress St', 'Tucson', 'AZ', '85701',
   '{"lat": 32.2217, "lng": -110.9665}',
   'Penthouse unit 4B. Doorman will let you up. Possible flashing failure at parapet.'),

  -- More scheduled
  (v_org_id, 'JOB-1012', 'Fascia & Soffit Repair — Midvale Park', 'Replace rotted fascia boards and repaint soffit on south and west sides.', 'scheduled', 'low',
   NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 4 hours',
   '4802 E 22nd St', 'Tucson', 'AZ', '85711',
   '{"lat": 32.2156, "lng": -110.9040}',
   'Lumber pre-ordered at Home Depot on Valencia.');

END $$;

-- ============================================================
-- DONE! Schema created, RLS enforced, Platinum Builders seeded.
-- ============================================================
