import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .in('status', ['draft', 'approved'])
    .select('*, vendor:vendors(*)')
    .single()

  if (error || !data) return NextResponse.json({ error: 'PO not found or cannot be sent' }, { status: 400 })

  // TODO: Send email to vendor via Resend when vendor.email exists
  // if (data.vendor?.email) { await resend.emails.send(...) }

  return NextResponse.json({ data, success: true })
}
