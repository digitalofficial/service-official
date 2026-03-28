import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@service-official/database'
import { InvoiceTemplate } from '@/components/invoices/invoice-template'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Invoice' }

export default async function PublicInvoicePage({ params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient()

  // Fetch invoice with related data
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*),
      line_items:invoice_line_items(*)
    `)
    .eq('id', params.id)
    .single()

  if (!invoice) notFound()

  // Fetch the organization for branding
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', invoice.organization_id)
    .single()

  // Increment view count
  await supabase
    .from('invoices')
    .update({
      view_count: (invoice.view_count ?? 0) + 1,
      status: invoice.status === 'sent' ? 'viewed' : invoice.status,
    })
    .eq('id', params.id)

  const customer = (invoice as any)?.customer
  const lineItems = (invoice as any)?.line_items ?? []

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-[850px] mx-auto">
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-4 no-print">
          <div className="flex items-center gap-3">
            {organization?.logo_url ? (
              <img src={organization.logo_url} alt="" className="h-8 w-auto" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: organization?.primary_color ?? '#2563eb' }}
              >
                {organization?.name?.[0]}
              </div>
            )}
            <span className="text-sm text-gray-500">Invoice from <strong className="text-gray-900">{organization?.name}</strong></span>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 no-print"
          >
            Download PDF
          </button>
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

        <p className="text-center text-xs text-gray-400 mt-6 no-print">
          Powered by Service Official
        </p>
      </div>
    </div>
  )
}
