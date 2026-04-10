import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function PATCH() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
