import { NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function PATCH() {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, supabase } = result

  await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
