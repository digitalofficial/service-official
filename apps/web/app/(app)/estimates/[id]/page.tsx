import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@service-official/database'
import { EstimateTemplate } from '@/components/estimates/estimate-template'
import { EstimateActions } from './estimate-actions'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Estimate Detail' }

export default async function EstimateDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  const { data: estimate } = await supabase
    .from('estimates')
    .select(`
      *,
      customer:customers(*),
      line_items:estimate_line_items(*)
    `)
    .eq('id', params.id)
    .single()

  if (!estimate) notFound()

  const organization = (profile as any)?.organization
  const customer = (estimate as any)?.customer
  const lineItems = ((estimate as any)?.line_items ?? []).sort((a: any, b: any) => a.order_index - b.order_index)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href="/estimates" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{estimate.estimate_number}</h1>
            <p className="text-sm text-gray-500">{estimate.title}</p>
          </div>
        </div>
        <EstimateActions estimateId={params.id} status={estimate.status} />
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <EstimateTemplate
          estimate={estimate}
          organization={organization}
          customer={customer}
          lineItems={lineItems}
        />
      </div>
    </div>
  )
}
