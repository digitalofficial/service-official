import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

async function sendResendEmail(to: string, subject: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return false
  const fromEmail = process.env.EMAIL_FROM || 'noreply@serviceofficial.app'
  const fromName = process.env.EMAIL_FROM_NAME || 'Service Official'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${fromName} <${fromEmail}>`, to, subject, html }),
    })
    return res.ok
  } catch {
    return false
  }
}

const assignSchema = z.object({
  subcontractor_id: z.string().uuid(),
  scope: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { data: job } = await supabase
    .from('jobs').select('id').eq('id', params.id).eq('organization_id', profile.organization_id).single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('job_subcontractors')
    .select('*, subcontractor:subcontractors(id, company_name, contact_name, email, phone, trade)')
    .eq('job_id', params.id)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager', 'project_manager'] })
  if ('error' in result) return result.error
  const { profile, supabase, user } = result

  let body: any
  try {
    body = assignSchema.parse(await req.json())
  } catch (err: any) {
    return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
  }

  const [{ data: job }, { data: sub }] = await Promise.all([
    supabase.from('jobs').select('id, title, scheduled_start, address_line1, city, state').eq('id', params.id).eq('organization_id', profile.organization_id).single(),
    supabase.from('subcontractors').select('id, company_name, email').eq('id', body.subcontractor_id).eq('organization_id', profile.organization_id).single(),
  ])
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (!sub) return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('job_subcontractors')
    .insert({
      job_id: params.id,
      subcontractor_id: body.subcontractor_id,
      organization_id: profile.organization_id,
      assigned_by: user.id,
      scope: body.scope ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Subcontractor already assigned to this job' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify subcontractor by email if present (best-effort)
  if (sub.email) {
    const location = [job.address_line1, job.city, job.state].filter(Boolean).join(', ')
    const when = job.scheduled_start ? new Date(job.scheduled_start).toLocaleString() : 'TBD'
    const html = `<p>Hi ${sub.company_name},</p>
      <p>You have been assigned to job <strong>${job.title}</strong>.</p>
      <p><strong>When:</strong> ${when}<br/>
      <strong>Where:</strong> ${location || 'TBD'}</p>
      ${body.scope ? `<p><strong>Scope:</strong> ${body.scope}</p>` : ''}`
    const sent = await sendResendEmail(sub.email, `New job assignment: ${job.title}`, html)
    if (sent) {
      await supabase
        .from('job_subcontractors')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', data.id)
    }
  }

  return NextResponse.json({ data, success: true }, { status: 201 })
}
