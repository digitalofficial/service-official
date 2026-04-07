import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@service-official/database'
import { PaymentForm } from './payment-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pay Invoice' }

export default async function PaymentPage({ params }: { params: { id: string } }) {
  const paymentIntentId = params.id
  const supabase = createServiceRoleClient()

  // Fetch payment by stripe_payment_intent_id
  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (!payment || error) notFound()

  // Fetch invoice
  const { data: invoice } = payment.invoice_id
    ? await supabase
        .from('invoices')
        .select('*')
        .eq('id', payment.invoice_id)
        .single()
    : { data: null }

  // Fetch customer
  const { data: customer } = payment.customer_id
    ? await supabase
        .from('customers')
        .select('*')
        .eq('id', payment.customer_id)
        .single()
    : { data: null }

  // Fetch organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, logo_url, primary_color, stripe_publishable_key, payments_enabled')
    .eq('id', payment.organization_id)
    .single()

  if (!organization) notFound()

  const alreadyPaid = payment.status === 'succeeded'
  const customerName = customer
    ? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() || customer.company_name || 'Customer'
    : 'Customer'

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-8 sm:py-16">
      <div className="w-full max-w-md">
        {/* Org branding */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {organization.logo_url ? (
            <img src={organization.logo_url} alt="" className="h-10 w-auto" />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: organization.primary_color ?? '#2563eb' }}
            >
              {organization.name?.[0]}
            </div>
          )}
          <span className="text-lg font-semibold text-gray-900">{organization.name}</span>
        </div>

        {/* Payment card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Invoice summary */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            {invoice?.invoice_number && (
              <p className="text-sm text-gray-500 mb-1">Invoice #{invoice.invoice_number}</p>
            )}
            <p className="text-3xl font-bold text-gray-900">
              ${Number(payment.amount).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {customerName}
            </p>
            {invoice?.due_date && (
              <p className="text-xs text-gray-400 mt-1">
                Due {new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>

          {/* Payment form or status */}
          <div className="px-6 py-6">
            {alreadyPaid ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Already Paid</h2>
                <p className="text-sm text-gray-500">This invoice has already been paid. You can close this page.</p>
              </div>
            ) : !organization.stripe_publishable_key || !organization.payments_enabled ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">Online payment is not available for this invoice. Please contact {organization.name} directly.</p>
              </div>
            ) : (
              <PaymentForm
                stripePublishableKey={organization.stripe_publishable_key}
                paymentIntentId={paymentIntentId}
                amount={Number(payment.amount)}
              />
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by Service Official
        </p>
      </div>
    </div>
  )
}
