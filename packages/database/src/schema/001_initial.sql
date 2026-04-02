-- ============================================================
-- SERVICE OFFICIAL — Full Database Schema
-- Supabase / PostgreSQL
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- for location/routing features

-- ============================================================
-- ENUMS
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
-- ORGANIZATIONS (Multi-tenant root)
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
  -- Branding
  primary_color TEXT DEFAULT '#0066FF',
  secondary_color TEXT DEFAULT '#1A1A2E',
  -- Settings
  settings JSONB DEFAULT '{}',
  -- Subscription
  subscription_tier subscription_tier DEFAULT 'solo',
  subscription_status subscription_status DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS & TEAM MEMBERS
-- ============================================================

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
  -- Field data
  employee_id TEXT,
  hourly_rate DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  -- Notifications preferences
  notify_sms BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT TRUE,
  notify_push BOOLEAN DEFAULT TRUE,
  -- Location (for dispatch)
  last_location JSONB,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS / CRM
-- ============================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Contact Info
  type TEXT DEFAULT 'residential' CHECK (type IN ('residential', 'commercial', 'property_manager', 'hoa', 'government')),
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  email TEXT,
  email_secondary TEXT,
  phone TEXT,
  phone_secondary TEXT,
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  -- Billing Address (if different)
  billing_same_as_service BOOLEAN DEFAULT TRUE,
  billing_address JSONB,
  -- CRM
  tags TEXT[] DEFAULT '{}',
  source TEXT, -- google, referral, door-knock, website, etc.
  notes TEXT,
  internal_notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  -- Financial
  total_revenue DECIMAL(12,2) DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  -- Portal Access
  portal_access BOOLEAN DEFAULT FALSE,
  portal_token TEXT UNIQUE,
  -- Meta
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEADS
-- ============================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  -- Lead Info
  status lead_status DEFAULT 'new',
  title TEXT NOT NULL,
  description TEXT,
  estimated_value DECIMAL(10,2),
  source TEXT,
  source_detail TEXT,
  -- Contact (before converted to customer)
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  -- Assignment
  assigned_to UUID REFERENCES profiles(id),
  -- Dates
  follow_up_date TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  -- Meta
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECTS (Core feature — roofing, GC, etc.)
-- ============================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  lead_id UUID REFERENCES leads(id),
  -- Project Info
  project_number TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status project_status DEFAULT 'estimating',
  industry industry_type,
  type TEXT, -- e.g. "full_replace", "repair", "new_construction", "renovation"
  -- Location
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'US',
  coordinates JSONB, -- {lat, lng}
  -- Financials
  contract_value DECIMAL(12,2),
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2) DEFAULT 0,
  profit_margin DECIMAL(5,2),
  -- Dates
  estimated_start_date DATE,
  estimated_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  -- Team
  project_manager_id UUID REFERENCES profiles(id),
  foreman_id UUID REFERENCES profiles(id),
  -- Roofing specific
  roof_type TEXT, -- shingle, metal, tile, flat, etc.
  roof_slope TEXT,
  roof_squares DECIMAL(8,2),
  -- GC specific
  permit_number TEXT,
  permit_issued_date DATE,
  permit_expiry_date DATE,
  inspection_required BOOLEAN DEFAULT FALSE,
  -- Settings
  client_portal_enabled BOOLEAN DEFAULT FALSE,
  client_can_message BOOLEAN DEFAULT FALSE,
  -- Meta
  tags TEXT[] DEFAULT '{}',
  internal_notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Phases (e.g. Demo, Framing, Roofing, Cleanup)
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

-- Project Milestones
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

-- Project Team Assignment
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

-- Subcontractors (companies, not users)
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

-- ============================================================
-- JOBS (Scheduled work — different from Projects)
-- ============================================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  customer_id UUID REFERENCES customers(id),
  -- Job Info
  job_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status job_status DEFAULT 'unscheduled',
  type TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  -- Schedule
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  duration_minutes INTEGER,
  -- Location
  address_line1 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  coordinates JSONB,
  -- Team
  assigned_to UUID REFERENCES profiles(id),
  -- Notes
  instructions TEXT,
  completion_notes TEXT,
  -- Meta
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FILES / DOCUMENTS
-- ============================================================

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Polymorphic links
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  estimate_id UUID,
  invoice_id UUID,
  -- File Info
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type file_type DEFAULT 'other',
  mime_type TEXT,
  size_bytes BIGINT,
  storage_path TEXT NOT NULL, -- Supabase storage path
  public_url TEXT,
  thumbnail_url TEXT,
  -- Metadata
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  version INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT FALSE, -- visible on client portal
  -- Meta
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PHOTOS (separate from files for gallery features)
-- ============================================================

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES project_phases(id),
  -- Photo Info
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  taken_at TIMESTAMPTZ,
  location JSONB,
  -- Tags
  tags TEXT[] DEFAULT '{}',
  is_before BOOLEAN,
  is_after BOOLEAN,
  is_public BOOLEAN DEFAULT FALSE,
  -- Meta
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BLUEPRINTS
-- ============================================================

CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  -- Blueprint Info
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0',
  discipline TEXT, -- architectural, structural, mechanical, electrical, plumbing
  scale TEXT,
  -- Storage
  file_id UUID REFERENCES files(id),
  storage_path TEXT,
  public_url TEXT,
  page_count INTEGER,
  -- Processing status
  is_processed BOOLEAN DEFAULT FALSE,
  processing_status TEXT DEFAULT 'pending',
  -- Meta
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

-- ============================================================
-- TAKEOFFS (AI-assisted material estimation)
-- ============================================================

CREATE TABLE takeoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  blueprint_id UUID REFERENCES blueprints(id),
  estimate_id UUID,
  -- Takeoff Info
  name TEXT NOT NULL,
  trade TEXT, -- roofing, drywall, concrete, etc.
  status takeoff_status DEFAULT 'pending',
  -- AI Processing
  ai_model TEXT,
  ai_confidence DECIMAL(5,2),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  -- Review
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  -- Meta
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE takeoff_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  takeoff_id UUID NOT NULL REFERENCES takeoffs(id) ON DELETE CASCADE,
  -- Source
  sheet_id UUID REFERENCES blueprint_sheets(id),
  -- Item Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  -- Measurements
  quantity DECIMAL(12,4),
  unit TEXT,
  -- AI Data
  ai_quantity DECIMAL(12,4),
  confidence_score DECIMAL(5,2),
  formula_used TEXT,
  source_coordinates JSONB,
  -- Review
  is_reviewed BOOLEAN DEFAULT FALSE,
  is_overridden BOOLEAN DEFAULT FALSE,
  override_quantity DECIMAL(12,4),
  override_reason TEXT,
  -- Material Link
  material_id UUID,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ESTIMATES
-- ============================================================

CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  customer_id UUID REFERENCES customers(id),
  takeoff_id UUID REFERENCES takeoffs(id),
  -- Estimate Info
  estimate_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status estimate_status DEFAULT 'draft',
  -- Dates
  issue_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  approved_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  -- Financials
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  -- Terms
  terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  -- Digital signature
  signature_url TEXT,
  signed_at TIMESTAMPTZ,
  signed_by_name TEXT,
  signed_by_ip TEXT,
  -- Tracking
  viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  -- Meta
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
  -- Item Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  -- Pricing
  quantity DECIMAL(12,4) DEFAULT 1,
  unit TEXT,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  markup_percent DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  -- Source
  material_id UUID,
  takeoff_item_id UUID REFERENCES takeoff_items(id),
  -- Display
  order_index INTEGER DEFAULT 0,
  is_optional BOOLEAN DEFAULT FALSE,
  is_taxable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVOICES
-- ============================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  customer_id UUID REFERENCES customers(id),
  estimate_id UUID REFERENCES estimates(id),
  -- Invoice Info
  invoice_number TEXT,
  title TEXT,
  status invoice_status DEFAULT 'draft',
  type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'progress', 'deposit', 'final', 'credit')),
  -- Dates
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  -- Financials
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  amount_due DECIMAL(12,2) DEFAULT 0,
  -- Terms
  terms TEXT,
  notes TEXT,
  internal_notes TEXT,
  -- Tracking
  viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  reminder_sent_at TIMESTAMPTZ,
  -- Meta
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

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  customer_id UUID REFERENCES customers(id),
  -- Payment Info
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  method payment_method,
  status payment_status DEFAULT 'pending',
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  -- Notes
  reference TEXT,
  notes TEXT,
  -- Refund
  refunded_amount DECIMAL(12,2) DEFAULT 0,
  refunded_at TIMESTAMPTZ,
  -- Meta
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXPENSES
-- ============================================================

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  -- Expense Info
  title TEXT NOT NULL,
  description TEXT,
  category expense_category DEFAULT 'other',
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  -- Vendor
  vendor_name TEXT,
  vendor_invoice_number TEXT,
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
  is_billable BOOLEAN DEFAULT FALSE,
  is_reimbursable BOOLEAN DEFAULT FALSE,
  -- Receipt
  receipt_file_id UUID REFERENCES files(id),
  -- Dates
  expense_date DATE DEFAULT CURRENT_DATE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  -- Meta
  submitted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MATERIALS / CATALOG
-- ============================================================

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
  -- Item
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  -- Quantities
  quantity_estimated DECIMAL(12,4),
  quantity_ordered DECIMAL(12,4) DEFAULT 0,
  quantity_received DECIMAL(12,4) DEFAULT 0,
  quantity_used DECIMAL(12,4) DEFAULT 0,
  unit TEXT,
  -- Costs
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(12,2),
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'partial', 'received', 'installed')),
  supplier TEXT,
  po_number TEXT,
  ordered_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DAILY LOGS
-- ============================================================

CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  -- Weather
  weather weather_condition,
  temperature_high INTEGER,
  temperature_low INTEGER,
  wind_speed INTEGER,
  precipitation BOOLEAN DEFAULT FALSE,
  weather_delay BOOLEAN DEFAULT FALSE,
  weather_delay_hours DECIMAL(4,2),
  -- Work Summary
  work_performed TEXT NOT NULL,
  areas_worked TEXT,
  -- Crew
  crew_count INTEGER,
  crew_hours DECIMAL(6,2),
  -- Visitors
  visitors TEXT,
  inspectors TEXT,
  -- Issues
  safety_incidents TEXT,
  issues TEXT,
  -- Photos
  photos_attached BOOLEAN DEFAULT FALSE,
  -- Meta
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, log_date)
);

-- ============================================================
-- PUNCH LIST
-- ============================================================

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

-- ============================================================
-- RFIs (Requests for Information)
-- ============================================================

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

-- ============================================================
-- CHANGE ORDERS
-- ============================================================

CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  co_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status change_order_status DEFAULT 'draft',
  reason TEXT,
  -- Financials
  amount DECIMAL(12,2) DEFAULT 0,
  approved_amount DECIMAL(12,2),
  -- Schedule Impact
  schedule_days_impact INTEGER DEFAULT 0,
  -- Dates
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  -- Meta
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBMITTALS
-- ============================================================

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

-- ============================================================
-- MESSAGES / COMMUNICATIONS
-- ============================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  project_id UUID REFERENCES projects(id),
  channel message_channel NOT NULL,
  phone_number TEXT, -- for SMS
  email_address TEXT, -- for email
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
  -- External IDs
  twilio_sid TEXT,
  -- Status
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  -- Attachments
  media_urls TEXT[] DEFAULT '{}',
  -- Meta
  sent_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  -- Link
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  -- Delivery
  channels message_channel[] DEFAULT '{in_app}',
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  -- Meta
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUTOMATION
-- ============================================================

CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  trigger_event TEXT NOT NULL, -- e.g. 'project.status_changed', 'invoice.overdue'
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB NOT NULL, -- array of action objects
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

-- ============================================================
-- REPORTING / ANALYTICS SNAPSHOTS
-- ============================================================

CREATE TABLE report_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
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
-- INDEXES
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
-- ROW LEVEL SECURITY (RLS)
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

-- Org isolation policy (example — apply to all tables)
CREATE POLICY "org_isolation" ON projects
  USING (organization_id = (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
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
