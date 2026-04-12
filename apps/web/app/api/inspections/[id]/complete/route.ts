import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, supabase } = result

  // Get all items
  const { data: items } = await supabase
    .from('inspection_items')
    .select('status, is_required')
    .eq('inspection_id', params.id)

  if (!items?.length) return NextResponse.json({ error: 'No items to complete' }, { status: 400 })

  // Check all required items are responded to
  const unansweredRequired = items.filter(i => i.is_required && i.status === 'pending')
  if (unansweredRequired.length > 0) {
    return NextResponse.json({ error: `${unansweredRequired.length} required items not yet answered` }, { status: 400 })
  }

  const passCount = items.filter(i => i.status === 'pass').length
  const failCount = items.filter(i => i.status === 'fail').length
  const naCount = items.filter(i => i.status === 'na').length

  const overallResult = failCount > 0 ? 'fail' : passCount > 0 ? 'pass' : 'partial'
  const status = failCount > 0 ? 'failed' : 'completed'

  const { data, error } = await supabase
    .from('inspections')
    .update({
      status,
      completed_at: new Date().toISOString(),
      completed_by: user.id,
      pass_count: passCount,
      fail_count: failCount,
      na_count: naCount,
      total_items: items.length,
      overall_result: overallResult,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, success: true })
}
