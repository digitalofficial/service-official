import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const subcontractorSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  trade: z.string().optional().nullable(),
  trades: z.array(z.string()).optional().nullable(),
  license_number: z.string().optional().nullable(),
  license_expiry: z.string().optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  ein: z.string().optional().nullable(),
  coi_file_url: z.string().optional().nullable(),
  general_liability_policy: z.string().optional().nullable(),
  general_liability_expiry: z.string().optional().nullable(),
  workers_comp_policy: z.string().optional().nullable(),
  workers_comp_expiry: z.string().optional().nullable(),
  auto_insurance_policy: z.string().optional().nullable(),
  auto_insurance_expiry: z.string().optional().nullable(),
  payment_method: z.enum(['check', 'direct_deposit', 'ach', 'zelle', 'venmo', 'other']).optional().nullable(),
  payment_rate: z.number().optional().nullable(),
  payment_rate_type: z.enum(['hourly', 'daily', 'per_job', 'percentage']).optional().nullable(),
  w9_on_file: z.boolean().optional().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile, supabase } = result

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'

    let query = supabase
      .from('subcontractors')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('company_name', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Add insurance status to each subcontractor
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000)

    const enriched = (data || []).map((sub: any) => {
      const expiryFields = [
        { key: 'insurance_expiry', label: 'Insurance' },
        { key: 'general_liability_expiry', label: 'General Liability' },
        { key: 'workers_comp_expiry', label: 'Workers Comp' },
        { key: 'auto_insurance_expiry', label: 'Auto Insurance' },
        { key: 'license_expiry', label: 'License' },
      ]

      let worstStatus: 'valid' | 'expiring_soon' | 'expired' = 'valid'

      for (const field of expiryFields) {
        const val = sub[field.key]
        if (!val) continue
        const expDate = new Date(val)
        if (expDate < now) {
          worstStatus = 'expired'
          break
        } else if (expDate < thirtyDaysFromNow) {
          worstStatus = 'expiring_soon'
        }
      }

      return { ...sub, insurance_status: worstStatus }
    })

    return NextResponse.json({ data: enriched })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager', 'project_manager'] })
    if ('error' in result) return result.error
    const { profile, supabase } = result

    const body = await request.json()
    const validated = subcontractorSchema.parse(body)

    const { data, error } = await supabase
      .from('subcontractors')
      .insert({
        ...validated,
        organization_id: profile.organization_id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data, success: true }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
