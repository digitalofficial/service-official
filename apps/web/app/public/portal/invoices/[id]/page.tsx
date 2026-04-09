'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react'
import { InvoiceTemplate } from '@/components/invoices/invoice-template'

export default function PortalInvoiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/portal/invoices/${params.id}`)
      .then(r => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Access denied' : 'Not found')
        return r.json()
      })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.id])

  async function handlePay() {
    setPaying(true)
    try {
      const res = await fetch(`/api/portal/invoices/${params.id}/pay`, { method: 'POST' })
      const result = await res.json()
      if (res.ok && result.payment_intent_id) {
        window.location.href = `/pay/${result.payment_intent_id}`
      } else {
        setError(result.error || 'Failed to set up payment')
        setPaying(false)
      }
    } catch {
      setError('Network error')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{error || 'Invoice not found'}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">Go back</button>
      </div>
    )
  }

  const { invoice, lineItems, organization, payments, pendingPayment, permissions } = data
  const customer = invoice.customer
  const showPayButton = permissions.pay_invoices && invoice.amount_due > 0 && invoice.status !== 'paid' && organization?.payments_enabled
  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

  const statusIcon = (status: string) => {
    if (status === 'succeeded') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    if (status === 'pending' || status === 'processing') return <Clock className="w-4 h-4 text-amber-500" />
    if (status === 'refunded') return <RefreshCw className="w-4 h-4 text-blue-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {showPayButton && (
            <button
              onClick={handlePay}
              disabled={paying}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {paying ? 'Setting up...' : 'Pay Now'}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Invoice */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <InvoiceTemplate
          invoice={invoice}
          organization={organization}
          customer={customer}
          lineItems={lineItems}
        />
      </div>

      {/* Payment History */}
      {permissions.view_payment_history && payments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Payment History</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {payments.map((payment: any) => (
              <div key={payment.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(payment.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fmt(payment.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {payment.method && <span className="ml-1.5 capitalize">via {payment.method}</span>}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                  payment.status === 'succeeded' ? 'bg-emerald-100 text-emerald-700' :
                  payment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  payment.status === 'refunded' ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
