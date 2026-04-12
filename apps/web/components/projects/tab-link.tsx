'use client'

import { useRouter, usePathname } from 'next/navigation'

export function TabLink({ href, label }: { href: string; label: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const isActive = pathname === href || (label === 'Overview' && pathname.endsWith('/overview'))

  return (
    <button
      onClick={() => { router.push(href); router.refresh() }}
      className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
        isActive
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )
}
