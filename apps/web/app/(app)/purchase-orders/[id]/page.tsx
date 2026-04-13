'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogClose, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  ArrowLeft, Send, CheckCircle2, Package, Trash2,
  Building2, Calendar, DollarSign, FileText, Truck
} from 'lucide-react'

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

export default function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const id = params.id
  const router = useRouter()
  const [po, setPo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showReceiveModal, setShowReceiveModal] = useState(false)

  useEffect(() => { fetchPO() }, [id])

  async function fetchPO() {
    setLoading(true)
    const res = await fetch(`/api/purchase-orders/${id}`)
    if (!res.ok) { router.push('/purchase-orders'); return }
    const json = await res.json()
    setPo(json.data)
    setLoading(false)
  }

  async function handleAction(action: string) {
    const res = await fetch(`/api/purchase-orders/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    if (res.ok) {
      toast.success(`PO ${action === 'send' ? 'sent' : action === 'approve' ? 'approved' : action}`)
      fetchPO()
    } else {
      const err = await res.json()
      toast.error(err.error || `Failed to ${action}`)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this draft PO?')) return
    const res = await fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('PO deleted'); router.push('/purchase-orders') }
    else toast.error('Failed to delete')
  }

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-64 bg-gray-100 rounded-lg" /></div>
  if (!po) return null

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
  const canSend = ['draft', 'approved'].includes(po.status)
  const canApprove = po.status === 'pending_approval'
  const canReceive = ['sent', 'acknowledged', 'partial'].includes(po.status)
  const canDelete = po.status === 'draft'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/purchase-orders" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{po.po_number}</h1>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[po.status] || ''}`}>
                {po.status.replace(/_/g, ' ')}
              </span>
            </div>
            {po.title && <p className="text-sm text-gray-500">{po.title}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canApprove && <Button onClick={() => handleAction('approve')}><CheckCircle2 className="w-4 h-4 mr-2" />Approve</Button>}
          {canSend && <Button onClick={() => handleAction('send')}><Send className="w-4 h-4 mr-2" />Send to Vendor</Button>}
          {canReceive && <Button variant="outline" onClick={() => setShowReceiveModal(true)}><Package className="w-4 h-4 mr-2" />Receive</Button>}
          {canDelete && <Button variant="outline" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Line Items</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Item</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500">Qty</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500">Received</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500">Unit Cost</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {po.line_items?.map((li: any) => (
                  <tr key={li.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{li.name}</p>
                      {li.sku && <p className="text-xs text-gray-400">SKU: {li.sku}</p>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{li.quantity} {li.unit}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={li.quantity_received >= li.quantity ? 'text-emerald-600 font-medium' : li.quantity_received > 0 ? 'text-amber-600 font-medium' : 'text-gray-400'}>
                        {li.quantity_received || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(li.unit_cost)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(li.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td colSpan={4} className="px-4 py-2 text-right text-gray-500">Subtotal</td>
                  <td className="px-4 py-2 text-right font-medium">{fmt(po.subtotal)}</td>
                </tr>
                {po.tax_amount > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-4 py-2 text-right text-gray-500">Tax ({po.tax_rate}%)</td>
                    <td className="px-4 py-2 text-right font-medium">{fmt(po.tax_amount)}</td>
                  </tr>
                )}
                {po.shipping_cost > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-4 py-2 text-right text-gray-500">Shipping</td>
                    <td className="px-4 py-2 text-right font-medium">{fmt(po.shipping_cost)}</td>
                  </tr>
                )}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 text-base">{fmt(po.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Receipts */}
          {po.receipts?.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Receipt History</h2>
              <div className="space-y-3">
                {po.receipts.map((r: any) => (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-900">
                        Received by {r.receiver?.first_name} {r.receiver?.last_name}
                      </span>
                      <span className="text-gray-500">{new Date(r.received_at).toLocaleDateString()}</span>
                    </div>
                    {r.items?.map((ri: any) => {
                      const lineItem = po.line_items?.find((li: any) => li.id === ri.po_line_item_id)
                      return (
                        <p key={ri.id} className="text-sm text-gray-600">
                          {lineItem?.name}: <span className="font-medium">{ri.quantity_received}</span> received
                          {ri.condition !== 'good' && <span className="text-red-600 ml-1">({ri.condition})</span>}
                        </p>
                      )
                    })}
                    {r.notes && <p className="text-sm text-gray-500 mt-1">{r.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vendor Card */}
          {po.vendor && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Vendor
              </h3>
              <p className="font-semibold text-gray-900">{po.vendor.name}</p>
              {po.vendor.contact_name && <p className="text-sm text-gray-500">{po.vendor.contact_name}</p>}
              {po.vendor.email && <p className="text-sm text-gray-500">{po.vendor.email}</p>}
              {po.vendor.phone && <p className="text-sm text-gray-500">{po.vendor.phone}</p>}
            </div>
          )}

          {/* Details Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3 text-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Details
            </h3>
            <div className="flex justify-between"><span className="text-gray-500">Issue Date</span><span className="font-medium">{po.issue_date}</span></div>
            {po.expected_delivery && <div className="flex justify-between"><span className="text-gray-500">Expected Delivery</span><span className="font-medium">{po.expected_delivery}</span></div>}
            {po.payment_terms && <div className="flex justify-between"><span className="text-gray-500">Payment Terms</span><span className="font-medium">{po.payment_terms}</span></div>}
            {po.project && (
              <div className="flex justify-between">
                <span className="text-gray-500">Project</span>
                <Link href={`/projects/${po.project.id}`} className="text-blue-600 hover:underline font-medium">{po.project.name}</Link>
              </div>
            )}
            {po.creator && <div className="flex justify-between"><span className="text-gray-500">Created By</span><span className="font-medium">{po.creator.first_name} {po.creator.last_name}</span></div>}
            {po.approver && <div className="flex justify-between"><span className="text-gray-500">Approved By</span><span className="font-medium">{po.approver.first_name} {po.approver.last_name}</span></div>}
          </div>

          {/* Notes */}
          {(po.notes || po.internal_notes) && (
            <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
              {po.notes && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Notes</h4>
                  <p className="text-sm text-gray-600">{po.notes}</p>
                </div>
              )}
              {po.internal_notes && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Internal Notes</h4>
                  <p className="text-sm text-gray-600">{po.internal_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Receive Modal */}
      {showReceiveModal && (
        <ReceiveModal
          po={po}
          onClose={() => setShowReceiveModal(false)}
          onReceived={() => { setShowReceiveModal(false); fetchPO() }}
        />
      )}
    </div>
  )
}

function ReceiveModal({ po, onClose, onReceived }: { po: any; onClose: () => void; onReceived: () => void }) {
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState(
    po.line_items?.map((li: any) => ({
      po_line_item_id: li.id,
      name: li.name,
      remaining: li.quantity - (li.quantity_received || 0),
      quantity_received: Math.max(0, li.quantity - (li.quantity_received || 0)).toString(),
      condition: 'good',
      notes: '',
    })) || []
  )
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i: any) => ({
            po_line_item_id: i.po_line_item_id,
            quantity_received: parseFloat(i.quantity_received) || 0,
            condition: i.condition,
            notes: i.notes || undefined,
          })),
          notes: notes || undefined,
        }),
      })
      if (res.ok) {
        toast.success('Receipt recorded')
        onReceived()
      } else {
        toast.error('Failed to record receipt')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onClose={onClose}>
      <DialogClose onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Receive Items</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {items.map((item: any, i: number) => (
            <div key={item.po_line_item_id} className="border border-gray-100 rounded-lg p-3 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-sm text-gray-900">{item.name}</span>
                <span className="text-xs text-gray-500">{item.remaining} remaining</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Qty Received</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={item.quantity_received}
                    onChange={e => setItems((prev: any[]) => prev.map((p, j) => j === i ? { ...p, quantity_received: e.target.value } : p))}
                  />
                </div>
                <div>
                  <Label>Condition</Label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={item.condition}
                    onChange={e => setItems((prev: any[]) => prev.map((p, j) => j === i ? { ...p, condition: e.target.value } : p))}
                  >
                    <option value="good">Good</option>
                    <option value="damaged">Damaged</option>
                    <option value="wrong_item">Wrong Item</option>
                    <option value="short">Short</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          <div>
            <Label>Receipt Notes</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this delivery..." />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Recording...' : 'Record Receipt'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
