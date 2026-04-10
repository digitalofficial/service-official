'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Library, Wrench, Bookmark } from 'lucide-react'

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'library', label: 'Report Library', icon: Library },
  { key: 'builder', label: 'Custom Builder', icon: Wrench },
  { key: 'saved', label: 'Saved Reports', icon: Bookmark },
] as const

export type TabKey = (typeof tabs)[number]['key']

export function ReportTabs({ activeTab }: { activeTab: TabKey }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setTab(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    // Clear report-specific params when switching tabs
    params.delete('slug')
    router.push(`/reports?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
