import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, phone, email, is_active, hourly_rate, title')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .order('first_name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
