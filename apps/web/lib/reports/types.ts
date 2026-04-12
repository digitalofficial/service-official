export type ColumnFormat = 'text' | 'currency' | 'number' | 'date' | 'percent' | 'status'

export interface ColumnDef {
  key: string
  label: string
  format: ColumnFormat
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  showTotal?: boolean
}

export type ReportCategory = 'financial' | 'operations' | 'labor'

export interface ReportTemplate {
  slug: string
  name: string
  description: string
  category: ReportCategory
  icon: string // lucide icon name
  availableFilters: FilterKey[]
  columns: ColumnDef[]
  defaultGroupBy?: string
  showTotals: boolean
}

export type FilterKey = 'date_range' | 'customer_id' | 'project_id' | 'job_id' | 'status' | 'group_by'

export interface ReportFilters {
  date_from?: string
  date_to?: string
  customer_id?: string
  project_id?: string
  job_id?: string
  status?: string
  group_by?: string
}

export type ReportRow = Record<string, string | number | null>

export interface ReportResult {
  data: ReportRow[]
  columns: ColumnDef[]
  summary: Record<string, number>
}

export interface SavedReport {
  id: string
  name: string
  slug: string
  filters: ReportFilters
  organization_id: string
  created_by: string
  created_at: string
  updated_at: string
}
