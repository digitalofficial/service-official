'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface StatusTab {
  label: string
  value: string | undefined
  count?: number
}

interface StatusTabsProps {
  tabs: StatusTab[]
  basePath: string
  paramName?: string
}

export function StatusTabs({ tabs, basePath, paramName = 'status' }: StatusTabsProps) {
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get(paramName) ?? undefined

  return (
    <div className="flex items-center gap-1 border-b border-gray-200">
      {tabs.map((tab) => {
        const isActive = currentStatus === tab.value
        const href = tab.value ? `${basePath}?${paramName}=${tab.value}` : basePath

        return (
          <Link
            key={tab.label}
            href={href}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1.5 text-xs text-gray-400">({tab.count})</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
