'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, ShoppingCart, FileText } from 'lucide-react'
import type { PurchaseOrder } from '@service-official/types'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'partial', label: 'Partial' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'closed', label: 'Closed' },
]

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  sent: 'bg-sky-100 text-sky-700',
  acknowledged: 'bg-indigo-100 text-indigo-700',
  partial: 'bg-purple-100 text-purple-700',
  fulfilled: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-100 text-gray-500',
  canceled: 'bg-red-100 text-red-700',
}

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { fetchPOs() }, [statusFilter])

  async function fetchPOs() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/purchase-orders?${params}`)
    const json = await res.json()
    setPos(json.data || [])
    setLoading(false)
  }

  const filtered = pos.filter(po =>
    !search || po.po_number.toLowerCase().includes(search.toLowerCase()) ||
    po.title?.toLowerCase().includes(search.toLowerCase()) ||
    (po.vendor as any)?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

  const totalValue = pos.reduce((sum, po) => sum + (po.total || 0), 0)
  const pendingCount = pos.filter(po => po.status === 'pending_approval').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        count={pos.length}
        actions={
          <Link href="/purchase-orders/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create PO
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(totalValue)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total POs</p>
          <p className="text-2xl font-bold text-gray-900">{pos.length}</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
            <p className="text-sm text-amber-600">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search POs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 animate-pulse">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded" />)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No purchase orders</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first purchase order to start tracking materials</p>
          <Link href="/purchase-orders/new">
            <Button><Plus className="w-4 h-4 mr-2" />Create PO</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">PO #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Vendor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(po => (
                <tr key={po.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/purchase-orders/${po.id}`} className="text-blue-600 hover:underline font-medium">
                      {po.po_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{po.title || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{(po.vendor as any)?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {(po.project as any)?.name ? (
                      <Link href={`/projects/${(po.project as any).id}`} className="text-blue-600 hover:underline">
                        {(po.project as any).name}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[po.status] || ''}`}>
                      {po.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{po.issue_date}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(po.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
