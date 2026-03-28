import { statusColor } from '@/lib/utils'
import { cn } from '@/lib/utils/cn'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
  className?: string
}

export function ProjectStatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const colors = statusColor(status)
  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full capitalize border',
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1',
      colors.bg, colors.text, colors.border,
      className
    )}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
