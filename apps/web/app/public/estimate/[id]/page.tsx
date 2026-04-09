import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@service-official/database'
import { EstimateTemplate } from '@/components/estimates/estimate-template'
import { PublicEstimateActions } from './actions'
import type { Metadata } from 'next'

// CRITICAL: prevent Next.js from caching this page — must always read fresh from DB
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = { title: 'Estimate' }

export default async function PublicEstimatePage({ params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient()

  // Fetch estimate (no auth — public page, service role bypasses RLS)
  const { data: estimate, error } = await supabase
    .from('estimates')
    .select('*, customer:customers(*)')
    .eq('id', params.id)
    .single()

  if (!estimate || error) notFound()

  // Fetch line items
  const { data: lineItems } = await supabase
    .from('estimate_line_items')
    .select('*')
    .eq('estimate_id', params.id)
    .order('order_index', { ascending: true })

  // Fetch organization for branding
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', estimate.organization_id)
    .single()

  // Increment view count and update status to viewed if sent
  await supabase
    .from('estimates')
    .update({
      view_count: (estimate.view_count ?? 0) + 1,
      ...(estimate.status === 'sent' ? { status: 'viewed' } : {}),
    })
    .eq('id', params.id)

  const customer = (estimate as any)?.customer

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-[850px] mx-auto">
        {/* Actions bar — stacks on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            {organization?.logo_url ? (
              <img src={organization.logo_url} alt="" className="h-8 w-auto shrink-0" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: organization?.primary_color ?? '#2563eb' }}
              >
                {organization?.name?.[0]}
              </div>
            )}
            <span className="text-sm text-gray-500 truncate">Estimate from <strong className="text-gray-900">{organization?.name}</strong></span>
          </div>
          <PublicEstimateActions
            estimateId={params.id}
            estimateStatus={estimate.status}
            customerEmail={customer?.email}
            organizationName={organization?.name}
          />
        </div>

        {/* Status Banner */}
        {(estimate.status === 'approved' || estimate.status === 'converted') && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-emerald-800">
                  {estimate.status === 'converted' ? 'Estimate Approved & Invoice Created' : 'Estimate Approved'}
                </p>
                {estimate.approved_at && (
                  <p className="text-sm text-emerald-600">
                    Approved on {new Date(estimate.approved_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                {estimate.status === 'converted' && (
                  <p className="text-sm text-emerald-600">An invoice has been created and will be sent to you shortly.</p>
                )}
              </div>
              {estimate.signature_url && (
                <img src={estimate.signature_url} alt="Signature" className="h-10 sm:h-12 border border-emerald-200 rounded bg-white p-1 shrink-0" />
              )}
            </div>
          </div>
        )}

        {estimate.status === 'declined' && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <p className="font-semibold text-red-800">Estimate Declined</p>
          </div>
        )}

        {estimate.status === 'expired' && (
          <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="font-semibold text-gray-600">This estimate has expired</p>
            <p className="text-sm text-gray-500">Please contact {organization?.name} for an updated estimate.</p>
          </div>
        )}

        {/* Estimate */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <EstimateTemplate
            estimate={estimate}
            organization={organization}
            customer={customer}
            lineItems={lineItems ?? []}
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6 no-print">
          Powered by Service Official
        </p>
      </div>
    </div>
  )
}
