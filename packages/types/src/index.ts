// ============================================================
// SERVICE OFFICIAL — Global TypeScript Types
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type IndustryType =
  | 'roofing' | 'general_contractor' | 'electrical' | 'plumbing' | 'hvac'
  | 'landscaping' | 'painting' | 'flooring' | 'concrete' | 'masonry'
  | 'framing' | 'insulation' | 'windows_doors' | 'solar' | 'other'

export type SubscriptionTier = 'solo' | 'team' | 'growth' | 'enterprise'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'

export type UserRole =
  | 'owner' | 'admin' | 'office_manager' | 'estimator'
  | 'project_manager' | 'foreman' | 'technician' | 'dispatcher'
  | 'subcontractor' | 'viewer'

export type ProjectStatus =
  | 'lead' | 'estimating' | 'proposal_sent' | 'approved' | 'in_progress'
  | 'on_hold' | 'punch_list' | 'completed' | 'invoiced' | 'paid' | 'canceled' | 'warranty'

export type JobStatus =
  | 'unscheduled' | 'scheduled' | 'en_route' | 'on_site' | 'in_progress'
  | 'completed' | 'needs_follow_up' | 'canceled'

export type LeadStatus =
  | 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiating'
  | 'won' | 'lost' | 'unqualified'

export type EstimateStatus =
  | 'draft' | 'sent' | 'viewed' | 'approved' | 'declined' | 'expired' | 'converted'

export type InvoiceStatus =
  | 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'voided' | 'refunded'

export type PaymentMethod = 'card' | 'ach' | 'check' | 'cash' | 'zelle' | 'venmo' | 'other'
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded'

export type ExpenseCategory =
  | 'materials' | 'labor' | 'equipment' | 'fuel' | 'permits' | 'subcontractor'
  | 'tools' | 'dump_fees' | 'insurance' | 'overhead' | 'other'

export type FileType =
  | 'image' | 'pdf' | 'blueprint' | 'contract' | 'permit' | 'inspection'
  | 'warranty' | 'invoice' | 'estimate' | 'material_list' | 'safety' | 'other'

export type NotificationType =
  | 'job_assigned' | 'job_status_update' | 'estimate_approved' | 'estimate_declined'
  | 'invoice_paid' | 'invoice_overdue' | 'message_received' | 'project_update'
  | 'timeline_milestone' | 'expense_submitted' | 'rfi_submitted' | 'change_order_approved'
  | 'weather_alert' | 'safety_incident' | 'inspection_scheduled' | 'payment_received'
  | 'client_message' | 'task_assigned' | 'task_overdue' | 'document_uploaded'

export type MessageChannel = 'sms' | 'email' | 'in_app' | 'push'
export type MessageDirection = 'inbound' | 'outbound'
export type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold'
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'missed'
export type RFIStatus = 'open' | 'submitted' | 'under_review' | 'answered' | 'closed'
export type ChangeOrderStatus = 'draft' | 'submitted' | 'approved' | 'declined' | 'void'
export type SubmittalStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'resubmit'
export type TakeoffStatus = 'pending' | 'processing' | 'review' | 'approved' | 'exported'

// ── Base Types ───────────────────────────────────────────────

export interface BaseRecord {
  id: string
  created_at: string
  updated_at: string
}

export interface Address {
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface Coordinates {
  lat: number
  lng: number
}

// ── Organization ─────────────────────────────────────────────

export interface Organization extends BaseRecord {
  name: string
  slug: string
  industry: IndustryType
  logo_url?: string
  website?: string
  phone?: string
  email?: string
  address_line1?: string
  city?: string
  state?: string
  zip?: string
  timezone: string
  currency: string
  primary_color: string
  secondary_color: string
  settings: Record<string, unknown>
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  stripe_customer_id?: string
  trial_ends_at?: string
}

// ── User / Profile ───────────────────────────────────────────

export interface Profile extends BaseRecord {
  organization_id: string
  role: UserRole
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  title?: string
  employee_id?: string
  hourly_rate?: number
  is_active: boolean
  notify_sms: boolean
  notify_email: boolean
  notify_push: boolean
}

// ── Customer ─────────────────────────────────────────────────

export interface Customer extends BaseRecord, Address {
  organization_id: string
  type: 'residential' | 'commercial' | 'property_manager' | 'hoa' | 'government'
  first_name?: string
  last_name?: string
  company_name?: string
  display_name: string
  email?: string
  phone?: string
  tags: string[]
  source?: string
  notes?: string
  is_active: boolean
  total_revenue: number
  outstanding_balance: number
  portal_access: boolean
}

// ── Lead ─────────────────────────────────────────────────────

export interface Lead extends BaseRecord {
  organization_id: string
  customer_id?: string
  status: LeadStatus
  title: string
  description?: string
  estimated_value?: number
  source?: string
  assigned_to?: string
  follow_up_date?: string
  tags: string[]
  // Relations
  customer?: Customer
  assignee?: Profile
}

// ── Project ──────────────────────────────────────────────────

export interface Project extends BaseRecord, Address {
  organization_id: string
  customer_id?: string
  lead_id?: string
  project_number?: string
  name: string
  description?: string
  status: ProjectStatus
  industry?: IndustryType
  type?: string
  coordinates?: Coordinates
  contract_value?: number
  estimated_cost?: number
  actual_cost: number
  profit_margin?: number
  estimated_start_date?: string
  estimated_end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  project_manager_id?: string
  foreman_id?: string
  // Roofing specific
  roof_type?: string
  roof_slope?: string
  roof_squares?: number
  // GC specific
  permit_number?: string
  permit_issued_date?: string
  client_portal_enabled: boolean
  tags: string[]
  // Relations
  customer?: Customer
  project_manager?: Profile
  foreman?: Profile
  phases?: ProjectPhase[]
  team?: ProjectTeamMember[]
}

export interface ProjectPhase extends BaseRecord {
  project_id: string
  name: string
  description?: string
  status: PhaseStatus
  order_index: number
  start_date?: string
  end_date?: string
  actual_start?: string
  actual_end?: string
  color?: string
}

export interface ProjectMilestone extends BaseRecord {
  project_id: string
  phase_id?: string
  name: string
  description?: string
  status: MilestoneStatus
  due_date?: string
  completed_at?: string
  notify_client: boolean
}

export interface ProjectTeamMember {
  id: string
  project_id: string
  user_id: string
  role?: string
  hourly_rate?: number
  assigned_at: string
  profile?: Profile
}

// ── Job ──────────────────────────────────────────────────────

export interface Job extends BaseRecord {
  organization_id: string
  project_id?: string
  customer_id?: string
  job_number?: string
  title: string
  description?: string
  status: JobStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduled_start?: string
  scheduled_end?: string
  actual_start?: string
  actual_end?: string
  address_line1?: string
  city?: string
  state?: string
  zip?: string
  coordinates?: Coordinates
  assigned_to?: string
  instructions?: string
  completion_notes?: string
  tags: string[]
  // Relations
  assignee?: Profile
  project?: Project
  customer?: Customer
}

// ── File ─────────────────────────────────────────────────────

export interface FileRecord extends BaseRecord {
  organization_id: string
  project_id?: string
  job_id?: string
  customer_id?: string
  name: string
  original_name: string
  file_type: FileType
  mime_type?: string
  size_bytes?: number
  storage_path: string
  public_url?: string
  thumbnail_url?: string
  description?: string
  tags: string[]
  version: number
  is_public: boolean
  uploaded_by?: string
}

export interface Photo extends BaseRecord {
  organization_id: string
  project_id?: string
  job_id?: string
  phase_id?: string
  storage_path: string
  public_url: string
  thumbnail_url?: string
  caption?: string
  taken_at?: string
  location?: Coordinates
  tags: string[]
  is_before?: boolean
  is_after?: boolean
  is_public: boolean
  uploaded_by?: string
}

// ── Blueprint ────────────────────────────────────────────────

export interface Blueprint extends BaseRecord {
  organization_id: string
  project_id?: string
  name: string
  description?: string
  version: string
  discipline?: string
  scale?: string
  file_id?: string
  storage_path?: string
  public_url?: string
  page_count?: number
  is_processed: boolean
  processing_status: string
  uploaded_by?: string
  sheets?: BlueprintSheet[]
}

export interface BlueprintSheet extends BaseRecord {
  blueprint_id: string
  page_number: number
  title?: string
  sheet_number?: string
  discipline?: string
  scale?: string
  thumbnail_url?: string
  public_url?: string
  metadata: Record<string, unknown>
}

// ── Takeoff ──────────────────────────────────────────────────

export interface Takeoff extends BaseRecord {
  organization_id: string
  project_id?: string
  blueprint_id?: string
  estimate_id?: string
  name: string
  trade?: string
  status: TakeoffStatus
  ai_confidence?: number
  processing_started_at?: string
  processing_completed_at?: string
  reviewed_by?: string
  reviewed_at?: string
  notes?: string
  items?: TakeoffItem[]
}

export interface TakeoffItem extends BaseRecord {
  takeoff_id: string
  sheet_id?: string
  name: string
  description?: string
  category?: string
  quantity: number
  unit?: string
  ai_quantity?: number
  confidence_score?: number
  formula_used?: string
  is_reviewed: boolean
  is_overridden: boolean
  override_quantity?: number
  override_reason?: string
  material_id?: string
  unit_cost?: number
  total_cost?: number
}

// ── Estimate ─────────────────────────────────────────────────

export interface Estimate extends BaseRecord {
  organization_id: string
  project_id?: string
  customer_id?: string
  takeoff_id?: string
  estimate_number?: string
  title: string
  description?: string
  status: EstimateStatus
  issue_date: string
  expiry_date?: string
  approved_at?: string
  subtotal: number
  discount_type?: 'percent' | 'fixed'
  discount_value: number
  discount_amount: number
  tax_rate: number
  tax_amount: number
  total: number
  terms?: string
  notes?: string
  signature_url?: string
  signed_at?: string
  view_count: number
  sections?: EstimateSection[]
  line_items?: EstimateLineItem[]
  customer?: Customer
  project?: Project
}

export interface EstimateSection {
  id: string
  estimate_id: string
  name: string
  order_index: number
  line_items?: EstimateLineItem[]
}

export interface EstimateLineItem extends BaseRecord {
  estimate_id: string
  section_id?: string
  name: string
  description?: string
  category?: string
  quantity: number
  unit?: string
  unit_cost: number
  markup_percent: number
  total: number
  order_index: number
  is_optional: boolean
  is_taxable: boolean
}

// ── Invoice ──────────────────────────────────────────────────

export interface Invoice extends BaseRecord {
  organization_id: string
  project_id?: string
  customer_id?: string
  job_id?: string
  estimate_id?: string
  invoice_number?: string
  title?: string
  status: InvoiceStatus
  type: 'standard' | 'progress' | 'deposit' | 'final' | 'credit'
  issue_date: string
  due_date?: string
  paid_at?: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  total: number
  amount_paid: number
  amount_due: number
  terms?: string
  notes?: string
  view_count: number
  line_items?: InvoiceLineItem[]
  customer?: Customer
  project?: Project
  payments?: Payment[]
}

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  name: string
  description?: string
  quantity: number
  unit?: string
  unit_cost: number
  total: number
  is_taxable: boolean
  order_index: number
}

// ── Payment ──────────────────────────────────────────────────

export interface Payment extends BaseRecord {
  organization_id: string
  invoice_id?: string
  customer_id?: string
  amount: number
  currency: string
  method?: PaymentMethod
  status: PaymentStatus
  stripe_payment_intent_id?: string
  reference?: string
  notes?: string
  refunded_amount: number
}

// ── Expense ──────────────────────────────────────────────────

export interface Expense extends BaseRecord {
  organization_id: string
  project_id?: string
  job_id?: string
  title: string
  description?: string
  category: ExpenseCategory
  amount: number
  tax_amount: number
  total_amount: number
  vendor_name?: string
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed'
  is_billable: boolean
  is_reimbursable: boolean
  receipt_file_id?: string
  expense_date: string
  approved_at?: string
  approved_by?: string
  submitted_by?: string
}

// ── Materials ────────────────────────────────────────────────

export interface MaterialCatalogItem extends BaseRecord {
  organization_id: string
  name: string
  description?: string
  sku?: string
  category?: string
  trade?: string
  unit?: string
  unit_cost: number
  markup_percent: number
  supplier?: string
  is_active: boolean
}

export interface ProjectMaterial extends BaseRecord {
  project_id: string
  material_id?: string
  name: string
  description?: string
  category?: string
  quantity_estimated?: number
  quantity_ordered: number
  quantity_received: number
  quantity_used: number
  unit?: string
  unit_cost?: number
  total_cost?: number
  status: 'pending' | 'ordered' | 'partial' | 'received' | 'installed'
  supplier?: string
  po_number?: string
  notes?: string
}

// ── Daily Log ────────────────────────────────────────────────

export interface DailyLog extends BaseRecord {
  project_id: string
  log_date: string
  weather?: string
  temperature_high?: number
  temperature_low?: number
  weather_delay: boolean
  weather_delay_hours?: number
  work_performed: string
  areas_worked?: string
  crew_count?: number
  crew_hours?: number
  visitors?: string
  safety_incidents?: string
  issues?: string
  submitted_by: string
  submitter?: Profile
}

// ── Punch List ───────────────────────────────────────────────

export interface PunchListItem extends BaseRecord {
  project_id: string
  phase_id?: string
  title: string
  description?: string
  location?: string
  status: 'open' | 'in_progress' | 'completed' | 'void'
  priority: 'low' | 'normal' | 'high'
  assigned_to?: string
  due_date?: string
  completed_at?: string
  assignee?: Profile
}

// ── RFI ──────────────────────────────────────────────────────

export interface RFI extends BaseRecord {
  project_id: string
  rfi_number?: string
  title: string
  question: string
  answer?: string
  status: RFIStatus
  priority: string
  discipline?: string
  due_date?: string
  answered_at?: string
  submitted_by?: string
  assigned_to?: string
  answered_by?: string
}

// ── Change Order ─────────────────────────────────────────────

export interface ChangeOrder extends BaseRecord {
  project_id: string
  co_number?: string
  title: string
  description?: string
  status: ChangeOrderStatus
  reason?: string
  amount: number
  approved_amount?: number
  schedule_days_impact: number
  submitted_at?: string
  approved_at?: string
  approved_by?: string
}

// ── Messages ─────────────────────────────────────────────────

export interface Conversation extends BaseRecord {
  organization_id: string
  customer_id?: string
  project_id?: string
  channel: MessageChannel
  phone_number?: string
  email_address?: string
  subject?: string
  is_archived: boolean
  last_message_at?: string
  customer?: Customer
  messages?: Message[]
}

export interface Message extends BaseRecord {
  conversation_id: string
  organization_id: string
  direction: MessageDirection
  channel: MessageChannel
  body: string
  status: string
  sent_at: string
  delivered_at?: string
  read_at?: string
  media_urls: string[]
  sent_by?: string
}

// ── Notification ─────────────────────────────────────────────

export interface Notification extends BaseRecord {
  organization_id: string
  user_id: string
  type: NotificationType
  title: string
  body?: string
  entity_type?: string
  entity_id?: string
  action_url?: string
  channels: MessageChannel[]
  is_read: boolean
  read_at?: string
  sent_at: string
  data: Record<string, unknown>
}

// ── Automation ───────────────────────────────────────────────

export interface AutomationRule extends BaseRecord {
  organization_id: string
  name: string
  description?: string
  is_active: boolean
  trigger_event: string
  trigger_conditions: Record<string, unknown>
  actions: AutomationAction[]
  run_count: number
  last_run_at?: string
}

export interface AutomationAction {
  type: 'send_sms' | 'send_email' | 'send_push' | 'assign_job' | 'update_status' | 'create_task'
  config: Record<string, unknown>
}

// ── Subcontractor ────────────────────────────────────────────

export interface Subcontractor extends BaseRecord {
  organization_id: string
  company_name: string
  contact_name?: string
  email?: string
  phone?: string
  trade?: string
  license_number?: string
  insurance_expiry?: string
  rating?: number
  notes?: string
  is_active: boolean
}

// ── Equipment ───────────────────────────────────────────────

export type EquipmentStatus = 'available' | 'assigned' | 'maintenance' | 'repair' | 'retired'
export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'poor'
export type MaintenanceType = 'preventive' | 'corrective' | 'inspection' | 'calibration'
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped'

export interface Equipment extends BaseRecord {
  organization_id: string
  name: string
  type?: string
  make?: string
  model?: string
  year?: number
  serial_number?: string
  vin?: string
  license_plate?: string
  purchase_date?: string
  purchase_price?: number
  current_value?: number
  daily_rate?: number
  hourly_rate?: number
  status: EquipmentStatus
  condition: EquipmentCondition
  current_location?: string
  last_service_date?: string
  next_service_date?: string
  service_interval_days?: number
  meter_reading?: number
  meter_unit: 'hours' | 'miles' | 'kilometers'
  insurance_policy?: string
  insurance_expiry?: string
  photo_url?: string
  notes?: string
  tags: string[]
  is_active: boolean
  // Relations
  current_assignment?: EquipmentAssignment
}

export interface EquipmentAssignment extends BaseRecord {
  equipment_id: string
  project_id?: string
  job_id?: string
  assigned_to?: string
  start_date: string
  end_date?: string
  actual_return_date?: string
  daily_rate?: number
  total_cost?: number
  notes?: string
  created_by?: string
  // Relations
  equipment?: Equipment
  project?: Project
  job?: Job
  assignee?: Profile
}

export interface EquipmentMaintenance extends BaseRecord {
  equipment_id: string
  type: MaintenanceType
  title: string
  description?: string
  scheduled_date?: string
  completed_date?: string
  cost?: number
  vendor_name?: string
  meter_reading?: number
  next_service_date?: string
  performed_by?: string
  notes?: string
  status: MaintenanceStatus
  // Relations
  performer?: Profile
}

// ── Budget Management ───────────────────────────────────────

export type BudgetCategoryType =
  | 'materials' | 'labor' | 'equipment' | 'subcontractor' | 'permits'
  | 'fuel' | 'overhead' | 'contingency' | 'other'

export interface BudgetCategory extends BaseRecord {
  project_id: string
  name: string
  type: BudgetCategoryType
  budgeted_amount: number
  description?: string
  order_index: number
  // Computed
  actual_amount?: number
  variance?: number
  percent_used?: number
  line_items?: BudgetLineItem[]
}

export interface BudgetLineItem extends BaseRecord {
  budget_category_id: string
  project_id: string
  name: string
  description?: string
  budgeted_amount: number
  expense_id?: string
  material_id?: string
  time_entry_id?: string
  order_index: number
}

export interface BudgetSummary {
  total_budget: number
  total_actual: number
  total_variance: number
  percent_used: number
  categories: (BudgetCategory & {
    actual_amount: number
    variance: number
    percent_used: number
  })[]
  forecast_at_completion: number
  estimated_over_under: number
}

// ── Vendor ──────────────────────────────────────────────────

export interface Vendor extends BaseRecord {
  organization_id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address_line1?: string
  city?: string
  state?: string
  zip?: string
  website?: string
  payment_terms?: string
  notes?: string
  is_active: boolean
}

// ── Purchase Order ──────────────────────────────────────────

export type POStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'sent'
  | 'acknowledged' | 'partial' | 'fulfilled' | 'closed' | 'canceled'

export interface PurchaseOrder extends BaseRecord {
  organization_id: string
  project_id?: string
  vendor_id?: string
  po_number: string
  title?: string
  status: POStatus
  issue_date: string
  expected_delivery?: string
  delivered_at?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  shipping_cost: number
  total: number
  payment_terms?: string
  shipping_address?: string
  notes?: string
  internal_notes?: string
  requires_approval: boolean
  approved_by?: string
  approved_at?: string
  created_by?: string
  // Relations
  vendor?: Vendor
  project?: Project
  line_items?: POLineItem[]
  receipts?: POReceipt[]
}

export interface POLineItem extends BaseRecord {
  purchase_order_id: string
  project_material_id?: string
  catalog_material_id?: string
  name: string
  description?: string
  sku?: string
  quantity: number
  quantity_received: number
  unit?: string
  unit_cost: number
  total: number
  order_index: number
  notes?: string
}

export interface POReceipt extends BaseRecord {
  purchase_order_id: string
  received_by?: string
  received_at: string
  notes?: string
  photo_ids: string[]
  items?: POReceiptItem[]
}

export interface POReceiptItem {
  id: string
  receipt_id: string
  po_line_item_id: string
  quantity_received: number
  condition: 'good' | 'damaged' | 'wrong_item' | 'short'
  notes?: string
  created_at: string
}

// ── Gantt Chart ─────────────────────────────────────────────

export type GanttDependencyType = 'FS' | 'FF' | 'SS' | 'SF'

export interface GanttTask extends BaseRecord {
  project_id: string
  phase_id?: string
  milestone_id?: string
  parent_task_id?: string
  name: string
  start_date: string
  end_date: string
  duration_days: number
  progress: number
  is_milestone: boolean
  assigned_to?: string
  color?: string
  order_index: number
  notes?: string
  // Relations
  assignee?: Profile
  children?: GanttTask[]
  dependencies?: GanttDependency[]
}

export interface GanttDependency extends BaseRecord {
  project_id: string
  predecessor_id: string
  successor_id: string
  dependency_type: GanttDependencyType
  lag_days: number
}

// ── Inspections & Checklists ────────────────────────────────

export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'canceled'
export type ChecklistItemType = 'checkbox' | 'pass_fail' | 'text' | 'number' | 'photo' | 'signature' | 'select'
export type InspectionItemStatus = 'pending' | 'pass' | 'fail' | 'na'

export interface InspectionTemplate extends BaseRecord {
  organization_id?: string
  name: string
  description?: string
  trade?: string
  category?: string
  is_system: boolean
  is_active: boolean
  version: number
  created_by?: string
  sections?: TemplateSection[]
}

export interface TemplateSection extends BaseRecord {
  template_id: string
  name: string
  description?: string
  order_index: number
  items?: TemplateItem[]
}

export interface TemplateItem {
  id: string
  template_id: string
  section_id?: string
  label: string
  description?: string
  type: ChecklistItemType
  is_required: boolean
  options?: string[]
  order_index: number
  created_at: string
}

export interface Inspection extends BaseRecord {
  organization_id: string
  project_id?: string
  job_id?: string
  template_id?: string
  equipment_id?: string
  inspection_number?: string
  title: string
  description?: string
  status: InspectionStatus
  scheduled_date?: string
  started_at?: string
  completed_at?: string
  assigned_to?: string
  completed_by?: string
  pass_count: number
  fail_count: number
  na_count: number
  total_items: number
  overall_result?: 'pass' | 'fail' | 'partial'
  notes?: string
  location?: string
  created_by?: string
  // Relations
  assignee?: Profile
  items?: InspectionItem[]
  template?: InspectionTemplate
  project?: Project
}

export interface InspectionItem extends BaseRecord {
  inspection_id: string
  template_item_id?: string
  section_name?: string
  label: string
  type: ChecklistItemType
  is_required: boolean
  order_index: number
  value?: string
  status: InspectionItemStatus
  notes?: string
  photo_ids: string[]
  signature_url?: string
  responded_at?: string
}

// ── Client Portal ───────────────────────────────────────────

export interface PortalUser extends BaseRecord {
  customer_id: string
  organization_id: string
  email: string
  last_login_at?: string
  is_active: boolean
  customer?: Customer
}

export interface PortalMessage extends BaseRecord {
  organization_id: string
  project_id?: string
  portal_user_id?: string
  staff_user_id?: string
  direction: 'client_to_staff' | 'staff_to_client'
  body: string
  attachments: string[]
  is_read: boolean
  read_at?: string
}

export interface PortalProjectView {
  project: Pick<Project, 'id' | 'name' | 'status' | 'description' | 'estimated_start_date' | 'estimated_end_date'>
  phases: ProjectPhase[]
  milestones: ProjectMilestone[]
  photos: Photo[]
  files: FileRecord[]
  estimates: Estimate[]
  invoices: Invoice[]
  change_orders: ChangeOrder[]
  messages: PortalMessage[]
  progress_percent: number
}

// ── Dashboard / Analytics ────────────────────────────────────

export interface DashboardMetrics {
  revenue: {
    current_month: number
    last_month: number
    ytd: number
    outstanding: number
  }
  projects: {
    active: number
    completed_this_month: number
    overdue: number
  }
  jobs: {
    scheduled_today: number
    in_progress: number
    completed_this_week: number
  }
  leads: {
    new: number
    qualified: number
    close_rate: number
  }
  expenses: {
    this_month: number
    pending_approval: number
  }
}

// ── API Response Wrappers ────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}
