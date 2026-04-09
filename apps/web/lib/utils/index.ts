import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { cn as default }

// Default timezone for server-side rendering (Vercel runs in UTC)
const DEFAULT_TZ = process.env.NEXT_PUBLIC_TIMEZONE ?? 'MST'

export function formatDate(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date || date === '') return ''
  const parsed = typeof date === 'string' ? new Date(date) : date
  if (isNaN(parsed.getTime())) return ''
  const baseOpts = options ?? { month: 'short' as const, day: 'numeric' as const, year: 'numeric' as const }
  try {
    const opts: Intl.DateTimeFormatOptions = { timeZone: DEFAULT_TZ, ...baseOpts }
    if (options && !options.timeZone) opts.timeZone = DEFAULT_TZ
    return new Intl.DateTimeFormat('en-US', opts).format(parsed)
  } catch {
    // Fallback if timezone is not supported in runtime
    return new Intl.DateTimeFormat('en-US', baseOpts).format(parsed)
  }
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function statusColor(status: string): { bg: string; text: string; border?: string } {
  const colors: Record<string, { bg: string; text: string; border?: string }> = {
    // Jobs
    unscheduled: { bg: 'bg-gray-100', text: 'text-gray-700' },
    scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
    en_route: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    on_site: { bg: 'bg-purple-100', text: 'text-purple-700' },
    in_progress: { bg: 'bg-amber-100', text: 'text-amber-700' },
    completed: { bg: 'bg-green-100', text: 'text-green-700' },
    needs_follow_up: { bg: 'bg-orange-100', text: 'text-orange-700' },
    canceled: { bg: 'bg-red-100', text: 'text-red-700' },
    // Invoices & Estimates
    draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
    sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
    viewed: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    approved: { bg: 'bg-green-100', text: 'text-green-700' },
    declined: { bg: 'bg-red-100', text: 'text-red-700' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-500' },
    converted: { bg: 'bg-purple-100', text: 'text-purple-700' },
    partial: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    paid: { bg: 'bg-green-100', text: 'text-green-700' },
    overdue: { bg: 'bg-red-100', text: 'text-red-700' },
    voided: { bg: 'bg-gray-100', text: 'text-gray-500' },
    refunded: { bg: 'bg-gray-100', text: 'text-gray-500' },
    // Projects
    lead: { bg: 'bg-gray-100', text: 'text-gray-700' },
    estimating: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    proposal_sent: { bg: 'bg-blue-100', text: 'text-blue-700' },
    active: { bg: 'bg-green-100', text: 'text-green-700' },
    on_hold: { bg: 'bg-orange-100', text: 'text-orange-700' },
    punch_list: { bg: 'bg-purple-100', text: 'text-purple-700' },
    invoiced: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    // Payments
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-700' },
    succeeded: { bg: 'bg-green-100', text: 'text-green-700' },
    failed: { bg: 'bg-red-100', text: 'text-red-700' },
    // Generic
    open: { bg: 'bg-blue-100', text: 'text-blue-700' },
    closed: { bg: 'bg-gray-100', text: 'text-gray-500' },
  }
  return colors[status] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
}
