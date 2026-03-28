import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

function isAdmin(request: NextRequest) {
  return request.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

// PATCH /api/admin/clients/[id] — update tier, status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceRoleClient()
  const updates = await request.json()

  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/admin/clients/[id] — cancel
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceRoleClient()

  await supabase
    .from('organizations')
    .update({ subscription_status: 'canceled' })
    .eq('id', params.id)

  return NextResponse.json({ success: true })
}
