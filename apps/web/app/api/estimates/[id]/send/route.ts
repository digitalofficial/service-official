import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { sendEmail } from '@service-official/notifications'
import { trigger } from '@service-official/workflows'

// POST /api/estimates/[id]/send
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  const { data: estimate } = await supabase
    .from('estimates')
    .select('*, customer:customers(*), organization:organizations(*)')
    .eq('id', params.id)
    .single()

  if (!estimate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Update to sent
  await supabase.from('estimates').update({ status: 'sent' }).eq('id', params.id)

  // Send email if customer has email
  if (estimate.customer?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    await sendEmail({
      to: estimate.customer.email,
      subject: `Estimate #${estimate.estimate_number} from ${estimate.organization.name}`,
      template: 'estimate',
      variables: {
        customer_name: `${estimate.customer.first_name ?? ''} ${estimate.customer.last_name ?? ''}`.trim(),
        company_name: estimate.organization.name,
        estimate_number: estimate.estimate_number,
        estimate_total: estimate.total,
        estimate_url: `${appUrl}/portal/estimates/${params.id}`,
        expiry_date: estimate.expiry_date,
      },
    })
  }

  trigger('estimate.sent')(
    profile!.organization_id, 'estimate', params.id,
    { estimate_number: estimate.estimate_number, total: estimate.total }
  )

  return NextResponse.json({ success: true })
}
