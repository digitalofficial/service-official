import { createServiceRoleClient } from '@service-official/database'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Support Tickets — Admin' }

export default async function AdminTicketsPage() {
  const supabase = createServiceRoleClient()

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  const openCount = tickets?.filter(t => t.status === 'open').length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-gray-400 text-sm mt-1">
            {tickets?.length ?? 0} total — {openCount} open
          </p>
        </div>
      </div>

      {!tickets?.length ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
          <p className="text-gray-500">No support tickets yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h3 className="text-base font-medium text-white">{ticket.subject}</h3>
                  <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">{ticket.message}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>{ticket.user_name} ({ticket.user_email})</span>
                    <span>{ticket.org_name}</span>
                    <span>{formatDate(ticket.created_at, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                </div>
                <a
                  href={`mailto:${ticket.user_email}?subject=Re: ${encodeURIComponent(ticket.subject)}`}
                  className="text-xs text-blue-400 hover:underline shrink-0"
                >
                  Reply
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-green-500/20 text-green-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-gray-500/20 text-gray-400',
    closed: 'bg-gray-500/20 text-gray-500',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${map[status] ?? map.open}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: 'bg-gray-500/20 text-gray-400',
    normal: 'bg-blue-500/20 text-blue-400',
    high: 'bg-amber-500/20 text-amber-400',
    urgent: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${map[priority] ?? map.normal}`}>
      {priority}
    </span>
  )
}
