import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', options ?? { month: 'short', day: 'numeric', year: 'numeric' })
    .format(typeof date === 'string' ? new Date(date) : date)
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

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str
}

export function generateProjectNumber(count: number): string {
  return `PRJ-${String(count).padStart(4, '0')}`
}

export function generateInvoiceNumber(count: number): string {
  const year = new Date().getFullYear()
  return `INV-${year}-${String(count).padStart(4, '0')}`
}

export function statusColor(status: string): { bg: string; text: string; border: string } {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    // Project
    lead:           { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    estimating:     { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    proposal_sent:  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    approved:       { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    in_progress:    { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    on_hold:        { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    punch_list:     { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    completed:      { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    invoiced:       { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    paid:           { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    canceled:       { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    // Invoice
    draft:          { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    sent:           { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    viewed:         { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    partial:        { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    overdue:        { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    voided:         { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
    // Job
    unscheduled:    { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
    scheduled:      { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    en_route:       { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    on_site:        { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    needs_follow_up: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  }
  return map[status] ?? { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
}
