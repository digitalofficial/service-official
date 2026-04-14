import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
})

export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  let body
  try {
    body = schema.parse(await request.json())
  } catch (err: any) {
    return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
  }

  const { error, count } = await supabase
    .from('inspections')
    .update({ deleted_at: new Date().toISOString() }, { count: 'exact' })
    .in('id', body.ids)
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, deleted: count ?? 0 })
}
