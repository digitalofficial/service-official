import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .in('status', ['draft', 'approved'])
    .select('*, vendor:vendors(*)')
    .single()

  if (error || !data) return NextResponse.json({ error: 'PO not found or cannot be sent' }, { status: 400 })

  // TODO: Send email to vendor via Resend when vendor.email exists
  // if (data.vendor?.email) { await resend.emails.send(...) }

  return NextResponse.json({ data, success: true })
}
