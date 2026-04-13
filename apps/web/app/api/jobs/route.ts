import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@service-official/notifications'
import { trigger } from '@service-official/workflows'
import { sendOrgSms } from '@/lib/sms'
import { logMessage } from '@/lib/log-message'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const jobSchema = z.object({
  project_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduled_start: z.string().optional(),
  scheduled_end: z.string().optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  assigned_to: z.string().uuid().optional(),
  instructions: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notify_sms: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date') // YYYY-MM-DD for calendar view
  const assigned_to = searchParams.get('assigned_to')

  let query = supabase
    .from('jobs')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name, phone),
      assignee:profiles!assigned_to(id, first_name, last_name, avatar_url, phone),
      project:projects(id, name)
    `)
    .eq('organization_id', profile!.organization_id)
    .is('deleted_at', null)
    .order('scheduled_start', { ascending: true })

  // Field workers only see their own assigned jobs
  const selfOnlyRoles = ['technician', 'foreman', 'subcontractor']
  if (selfOnlyRoles.includes(profile!.role)) {
    query = query.eq('assigned_to', user.id)
  }

  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (status) query = query.eq('status', status)
  if (assigned_to) query = query.eq('assigned_to', assigned_to)
  if (date) {
    const start = `${date}T00:00:00`
    const end = `${date}T23:59:59`
    query = query.gte('scheduled_start', start).lte('scheduled_start', end)
  } else if (from && to) {
    query = query.gte('scheduled_start', `${from}T00:00:00`).lte('scheduled_start', `${to}T23:59:59`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const body = await request.json()
  const parsed = jobSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid job data' }, { status: 400 })
  }
  const validated = parsed.data

  const { notify_sms, ...jobFields } = validated

  // Auto job number
  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile!.organization_id)

  const job_number = `JOB-${String((count ?? 0) + 1).padStart(4, '0')}`

  // Auto-determine status: if schedule is provided, mark as scheduled
  const status = jobFields.scheduled_start ? 'scheduled' : 'unscheduled'

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...jobFields,
      job_number,
      organization_id: profile!.organization_id,
      created_by: user.id,
      status,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify assigned technician
  if (validated.assigned_to) {
    trigger('job.assigned')(
      profile!.organization_id,
      'job',
      data.id,
      { job_title: data.title, assigned_to: validated.assigned_to }
    )
  }

  // Send customer notifications — wrapped in try/catch so job creation still succeeds
  const notifications: { email?: any; sms?: any; error?: string } = {}

  try {
    if (validated.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id, first_name, last_name, company_name, email, phone')
        .eq('id', validated.customer_id)
        .single()

      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', profile!.organization_id)
        .single()

      if (customer && org) {
        const customerName = `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() || 'there'
        const location = [data.address_line1, data.city, data.state, data.zip].filter(Boolean).join(', ')

        // Format schedule for display
        let scheduledDate: string | undefined
        let scheduledTime: string | undefined
        if (data.scheduled_start) {
          const tz = process.env.NEXT_PUBLIC_TIMEZONE ?? 'America/Denver'
          const d = new Date(data.scheduled_start)
          scheduledDate = d.toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
          scheduledTime = d.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' })
        }

        // Always send email if customer has one
        if (customer.email) {
          const emailResult = await sendEmail({
            to: customer.email,
            subject: `Your service is booked — ${data.title}`,
            template: 'job_booked',
            variables: {
              customer_name: customerName,
              company_name: org.name,
              job_title: data.title,
              job_number,
              scheduled_date: scheduledDate,
              scheduled_time: scheduledTime,
              address: location || undefined,
            },
          })
          notifications.email = emailResult

          await logMessage({
            supabase,
            organization_id: profile!.organization_id,
            customer_id: customer.id,
            channel: 'email',
            direction: 'outbound',
            body: `Job booked confirmation sent — ${job_number}: ${data.title}`,
            email_address: customer.email,
            sent_by: user.id,
            status: emailResult.success ? 'sent' : 'failed',
          })
        } else {
          notifications.email = { success: false, error: 'No customer email' }
        }

        // Send SMS only if opted in
        if (notify_sms && customer.phone) {
          const smsBody = `Hi ${customer.first_name ?? 'there'}! Your service with ${org.name} has been booked. "${data.title}"${scheduledDate ? ` 🕐 ${scheduledDate}${scheduledTime ? ` at ${scheduledTime}` : ''}` : ''}${location ? ` 📍 ${location}` : ''}`

          const smsResult = await sendOrgSms({
            organizationId: profile!.organization_id,
            to: customer.phone,
            body: smsBody,
          })
          notifications.sms = smsResult

          await logMessage({
            supabase,
            organization_id: profile!.organization_id,
            customer_id: customer.id,
            channel: 'sms',
            direction: 'outbound',
            body: smsBody,
            phone_number: customer.phone,
            sent_by: user.id,
            status: smsResult.success ? 'sent' : 'failed',
          })
        }
      } else {
        notifications.error = `customer found: ${!!customer}, org found: ${!!org}`
      }
    } else {
      notifications.error = 'No customer_id on job'
    }
  } catch (err: any) {
    notifications.error = err.message ?? String(err)
    console.error('Job notification failed (job was still created):', err)
  }

  return NextResponse.json({ data, success: true, notifications }, { status: 201 })
}
