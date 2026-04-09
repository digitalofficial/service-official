import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@service-official/database'
import { InvoiceTemplate } from '@/components/invoices/invoice-template'
import { InvoiceActions } from './invoice-actions'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Invoice Detail' }

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organization:organizations(*)')
    .eq('id', user.id)
    .single()

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

  const organization = (profile as any)?.organization
  const customer = (invoice as any)?.customer
  const lineItems = (invoice as any)?.line_items ?? []

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{invoice.invoice_number}</h1>
            <p className="text-sm text-gray-500">{invoice.title}</p>
          </div>
        </div>
        <InvoiceActions
          invoiceId={params.id}
          status={invoice.status}
          hasEmail={!!customer?.email}
          hasPhone={!!customer?.phone}
        />
      </div>

      {/* Invoice Preview */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <InvoiceTemplate
          invoice={invoice}
          organization={organization}
          customer={customer}
          lineItems={lineItems}
        />
      </div>
    </div>
  )
}
