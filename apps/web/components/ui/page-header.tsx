import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  count?: number
  actions?: ReactNode
}

export function PageHeader({ title, description, count, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        {count != null && <p className="text-sm text-gray-500 mt-0.5">{count} total</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
