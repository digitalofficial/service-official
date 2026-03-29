'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard, FolderKanban, Users, UserPlus, Briefcase, Radio,
  Calendar, FileText, Receipt, CreditCard, MessageSquare,
  Zap, BarChart3, Map, Cpu, Settings, Building2,
  HardHat, Menu, X
} from 'lucide-react'

// Role-based nav access
// owner/admin see everything. Other roles see only what's listed.
const ROLE_ACCESS: Record<string, string[]> = {
  owner: ['*'],
  admin: ['*'],
  office_manager: ['/dashboard', '/dispatch', '/projects', '/jobs', '/calendar', '/customers', '/leads', '/estimates', '/invoices', '/payments', '/estimator', '/team', '/messages', '/settings'],
  estimator: ['/dashboard', '/projects', '/jobs', '/customers', '/estimates', '/estimator'],
  project_manager: ['/dashboard', '/projects', '/jobs', '/calendar', '/customers', '/estimates', '/team', '/messages'],
  foreman: ['/dashboard', '/jobs', '/calendar', '/team'],
  technician: ['/dashboard', '/jobs', '/calendar'],
  dispatcher: ['/dashboard', '/dispatch', '/jobs', '/calendar', '/customers', '/team'],
  subcontractor: ['/dashboard', '/jobs', '/calendar'],
  viewer: ['/dashboard', '/projects', '/jobs', '/calendar'],
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Dispatch', href: '/dispatch', icon: Radio },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Leads', href: '/leads', icon: UserPlus },
  { label: 'Estimates', href: '/estimates', icon: FileText },
  { label: 'Invoices', href: '/invoices', icon: Receipt },
  { label: 'Payments', href: '/payments', icon: CreditCard },
  { label: 'Estimator', href: '/estimator', icon: Cpu },
  { label: 'Team', href: '/team', icon: HardHat },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Automation', href: '/automation', icon: Zap },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  profile: any
  organization: any
  isSuperAdmin?: boolean
}

export function Sidebar({ profile, organization, isSuperAdmin = false }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const userRole = profile?.role ?? 'viewer'
  const access = ROLE_ACCESS[userRole] ?? ROLE_ACCESS.viewer
  const visibleNav = access.includes('*') ? NAV_ITEMS : NAV_ITEMS.filter(item => access.includes(item.href))

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shrink-0">
            <HardHat className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{organization?.name}</p>
            <p className="text-xs text-gray-400 truncate capitalize">{organization?.industry?.replace('_', ' ')}</p>
          </div>
        </div>
        {/* Close button (mobile only) */}
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
        {visibleNav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
        {/* Admin link — super admin only */}
        {isSuperAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg mt-2 text-sm transition-colors border border-dashed',
              pathname.startsWith('/admin')
                ? 'bg-purple-600 text-white border-purple-500'
                : 'text-purple-400 border-purple-800 hover:bg-purple-900/50 hover:text-purple-300'
            )}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Admin Panel</span>
          </Link>
        )}
      </nav>

      {/* Profile — extra bottom padding for Safari mobile URL bar */}
      <div className="px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-xs text-gray-400 capitalize">{profile?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile, slide-in when open */}
      <aside className={cn(
        'flex flex-col bg-gray-900 text-white w-64 shrink-0 transition-transform duration-200 z-50',
        'h-[100dvh] lg:h-screen',
        // Mobile: fixed, slide in/out
        'fixed lg:relative',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {sidebarContent}
      </aside>
    </>
  )
}
