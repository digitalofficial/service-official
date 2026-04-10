'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/utils'
import { Activity, Mail, Phone, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

interface ActivityMessage {
  id: string
  direction: string
  channel: 'sms' | 'email'
  body: string
  status: string
  sent_at: string
  delivered_at?: string
  read_at?: string
  conversation?: {
    id: string
    customer_id: string
    customer?: {
      id: string
      first_name?: string
      last_name?: string
      company_name?: string
      email?: string
      phone?: string
    }
  }
  sent_by?: string
}

const PAGE_SIZE = 25

export default function ActivityLogPage() {
  const [messages, setMessages] = useState<ActivityMessage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [channelFilter, setChannelFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true)
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (channelFilter) params.set('channel', channelFilter)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/activity?${params}`)
      const { data, total: count } = await res.json()
      setMessages(data ?? [])
      setTotal(count ?? 0)
      setLoading(false)
    }
    fetchActivity()
  }, [page, channelFilter, statusFilter])

  const getCustomerName = (msg: ActivityMessage) => {
    const c = msg.conversation?.customer
    if (!c) return 'Unknown'
    if (c.company_name) return c.company_name
    if (c.first_name) return `${c.first_name} ${c.last_name ?? ''}`.trim()
    return c.email ?? c.phone ?? 'Unknown'
  }

  const getSenderName = (_msg: ActivityMessage) => {
    // sent_by is a UUID — could resolve to name with a separate lookup if needed
    return ''
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1"><CheckCircle className="w-3 h-3" /> Sent</Badge>
      case 'delivered':
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 gap-1"><CheckCircle className="w-3 h-3" /> Delivered</Badge>
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>
      default:
        return <Badge variant="outline" className="text-gray-500 border-gray-200 gap-1"><Clock className="w-3 h-3" /> {status}</Badge>
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-500 mt-1">All outbound emails and texts sent to customers</p>
        </div>
        <div className="text-sm text-gray-400">{total} total</div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">Channel:</span>
        {['', 'email', 'sms'].map((ch) => (
          <Button
            key={ch}
            size="sm"
            variant={channelFilter === ch ? 'default' : 'outline'}
            onClick={() => { setChannelFilter(ch); setPage(0) }}
            className="h-7 text-xs"
          >
            {ch === '' ? 'All' : ch === 'email' ? 'Email' : 'Text'}
          </Button>
        ))}

        <span className="text-sm font-medium text-gray-500 ml-4">Status:</span>
        {['', 'sent', 'failed'].map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => { setStatusFilter(s); setPage(0) }}
            className="h-7 text-xs"
          >
            {s === '' ? 'All' : s === 'sent' ? 'Sent' : 'Failed'}
          </Button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading activity...</div>
      ) : messages.length === 0 ? (
        <EmptyState
          icon={<Activity className="w-12 h-12" />}
          title="No activity yet"
          description="Emails and texts sent to customers will appear here."
        />
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto bg-white">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Channel</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Message</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Sent By</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {msg.channel === 'email' ? (
                        <Mail className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Phone className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-xs text-gray-500 capitalize">{msg.channel === 'sms' ? 'Text' : 'Email'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{getCustomerName(msg)}</p>
                    <p className="text-xs text-gray-400">
                      {msg.channel === 'email'
                        ? msg.conversation?.customer?.email
                        : msg.conversation?.customer?.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700 truncate max-w-sm">{msg.body}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{getSenderName(msg) || '—'}</td>
                  <td className="px-4 py-3">{getStatusBadge(msg.status)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(msg.sent_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="h-7"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="h-7"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
