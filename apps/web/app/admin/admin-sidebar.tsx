'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { LayoutDashboard, Users, UserPlus, FileText, Settings, Menu, X, ArrowLeft, Shield } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Clients', href: '/admin/clients', icon: Users },
  { label: 'Add Client', href: '/admin/clients/new', icon: UserPlus },
  { label: 'Estimates', href: '/admin/revenue', icon: FileText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const content = (
    <>
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Shield className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Service Official</p>
          </div>
          <p className="text-sm font-semibold text-white">Admin Panel</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Back to app */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg mt-4 text-gray-500 hover:text-white hover:bg-gray-800 border border-dashed border-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Back to App</span>
        </Link>
      </nav>

      <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-gray-800">
        <p className="text-xs text-gray-500 truncate">{email}</p>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
        aria-label="Open admin menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col bg-gray-900 border-r border-gray-800 text-white w-60 shrink-0 transition-transform duration-200 z-50',
        'h-[100dvh] lg:h-screen',
        'fixed lg:relative',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {content}
      </aside>
    </>
  )
}
