import { formatDate } from '@/lib/utils'
import {
  Calendar, User, Play, CheckCircle, Camera, DollarSign, Clock,
} from 'lucide-react'

interface Props {
  job: any
  photoCount: number
  expenseCount: number
}

interface ActivityEntry {
  icon: React.ReactNode
  color: string
  label: string
  timestamp: string | null
}

export function ActivityFeed({ job, photoCount, expenseCount }: Props) {
  const assignee = job.assignee as any

  const entries: ActivityEntry[] = []

  // Job created
  if (job.created_at) {
    entries.push({
      icon: <Calendar className="w-3.5 h-3.5" />,
      color: 'bg-gray-400',
      label: 'Job created',
      timestamp: job.created_at,
    })
  }

  // Scheduled
  if (job.scheduled_start) {
    entries.push({
      icon: <Clock className="w-3.5 h-3.5" />,
      color: 'bg-blue-500',
      label: `Scheduled for ${formatDate(job.scheduled_start, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`,
      timestamp: job.scheduled_start,
    })
  }

  // Assigned
  if (assignee) {
    entries.push({
      icon: <User className="w-3.5 h-3.5" />,
      color: 'bg-indigo-500',
      label: `Assigned to ${assignee.first_name} ${assignee.last_name}`,
      timestamp: job.created_at, // best available
    })
  }

  // Work started
  if (job.actual_start) {
    entries.push({
      icon: <Play className="w-3.5 h-3.5" />,
      color: 'bg-sky-500',
      label: 'Work started',
      timestamp: job.actual_start,
    })
  }

  // Work completed
  if (job.actual_end) {
    entries.push({
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      color: 'bg-green-500',
      label: 'Work completed',
      timestamp: job.actual_end,
    })
  }

  // Photos
  if (photoCount > 0) {
    entries.push({
      icon: <Camera className="w-3.5 h-3.5" />,
      color: 'bg-amber-500',
      label: `${photoCount} photo${photoCount !== 1 ? 's' : ''} uploaded`,
      timestamp: null,
    })
  }

  // Expenses
  if (expenseCount > 0) {
    entries.push({
      icon: <DollarSign className="w-3.5 h-3.5" />,
      color: 'bg-emerald-500',
      label: `${expenseCount} expense${expenseCount !== 1 ? 's' : ''} logged`,
      timestamp: null,
    })
  }

  if (entries.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Activity</h2>
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full ${entry.color} text-white flex items-center justify-center shrink-0 mt-0.5`}>
              {entry.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700">{entry.label}</p>
              {entry.timestamp && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(entry.timestamp, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
