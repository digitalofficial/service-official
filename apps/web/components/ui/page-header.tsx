import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  count?: number
  actions?: ReactNode
}

export function PageHeader({ title, description, count, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        {count != null && <p className="text-sm text-gray-500 mt-0.5">{count} total</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  )
}
