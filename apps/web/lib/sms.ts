import { createServiceRoleClient } from '@service-official/database'

interface SendSmsParams {
  organizationId: string
  to: string
  body: string
}

interface SendSmsResult {
  success: boolean
  sid?: string
  error?: string
}

/**
 * Get Twilio credentials — uses global env vars (single account for all clients).
 * Falls back to per-org settings if they exist (enterprise white-label).
 */
function getTwilioCredentials(orgSettings?: any) {
  const globalSid = process.env.TWILIO_ACCOUNT_SID
  const globalToken = process.env.TWILIO_AUTH_TOKEN
  const globalPhone = process.env.TWILIO_PHONE_NUMBER

  // Per-org override for enterprise clients with their own Twilio
  if (orgSettings?.twilio_account_sid && orgSettings?.twilio_auth_token && orgSettings?.twilio_phone_number) {
    return {
      sid: orgSettings.twilio_account_sid,
      token: orgSettings.twilio_auth_token,
      phone: orgSettings.twilio_phone_number,
    }
  }

  // Global account
  if (globalSid && globalToken && globalPhone) {
    return { sid: globalSid, token: globalToken, phone: globalPhone }
  }

  return null
}

/**
 * Send an SMS via Twilio. Uses the global Twilio account by default,
 * falls back to per-org credentials for enterprise clients.
 */
export async function sendOrgSms({ organizationId, to, body }: SendSmsParams): Promise<SendSmsResult> {
  const supabase = createServiceRoleClient()

  // Get org's SMS settings (for notification toggles + optional per-org creds)
  const { data: settings } = await supabase
    .from('organization_sms_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (settings && !settings.is_enabled) {
    return { success: false, error: 'SMS not enabled for this organization' }
  }

  const creds = getTwilioCredentials(settings)
  if (!creds) {
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${creds.sid}/Messages.json`
    const auth = Buffer.from(`${creds.sid}:${creds.token}`).toString('base64')

    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: creds.phone,
        To: to,
        Body: body,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.message ?? 'Twilio error' }
    }

    return { success: true, sid: data.sid }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Send customer notification for a job.
 * Looks up the customer's phone from the job and sends via Twilio.
 */
export async function notifyCustomer(
  organizationId: string,
  jobId: string,
  messageType: 'booked' | 'on_the_way' | 'completed' | 'custom',
  customMessage?: string
): Promise<SendSmsResult> {
  const supabase = createServiceRoleClient()

  // Check if this notification type is enabled for the org
  const { data: smsSettings } = await supabase
    .from('organization_sms_settings')
    .select('notify_customer_booked, notify_customer_en_route, notify_customer_completed, is_enabled')
    .eq('organization_id', organizationId)
    .single()

  if (smsSettings && !smsSettings.is_enabled) return { success: false, error: 'SMS not enabled' }

  const enabledMap: Record<string, boolean> = {
    booked: smsSettings?.notify_customer_booked ?? true,
    on_the_way: smsSettings?.notify_customer_en_route ?? true,
    completed: smsSettings?.notify_customer_completed ?? false,
    custom: true,
  }

  if (!enabledMap[messageType]) return { success: false, error: `Customer ${messageType} notifications disabled` }

  // Get job + customer + org info
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      customer:customers(first_name, last_name, company_name, phone, sms_opt_in),
      assignee:profiles!assigned_to(first_name, last_name, phone)
    `)
    .eq('id', jobId)
    .single()

  if (!job) return { success: false, error: 'Job not found' }

  const customer = job.customer as any
  if (!customer?.phone) return { success: false, error: 'Customer has no phone number' }
  if (!customer?.sms_opt_in) return { success: false, error: 'Customer has not opted in to text messages' }

  // Get org name
  const { data: org } = await supabase.from('organizations').select('name').eq('id', organizationId).single()

  const orgName = org?.name ?? 'Your contractor'
  const assigneeName = job.assignee ? `${(job.assignee as any).first_name}` : 'Our team'
  const location = [job.address_line1, job.city, job.state].filter(Boolean).join(', ')
  const scheduledTime = job.scheduled_start
    ? new Date(job.scheduled_start).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : ''
  const customerName = customer.first_name ?? 'there'

  let message = ''

  switch (messageType) {
    case 'booked':
      message = `Hi ${customerName}! Your service with ${orgName} has been scheduled.\n\n"${job.title}"\n${scheduledTime ? `🕐 ${scheduledTime}\n` : ''}${location ? `📍 ${location}\n` : ''}\nWe'll send you a reminder before we arrive. Reply STOP to opt out.`
      break

    case 'on_the_way':
      message = `Hi ${customerName}! ${assigneeName} from ${orgName} is on the way to you now.\n\n"${job.title}"\n${location ? `📍 ${location}\n` : ''}\nEstimated arrival: 15-30 minutes.`
      break

    case 'completed':
      message = `Hi ${customerName}! Your service "${job.title}" has been completed by ${orgName}. Thank you for your business! If you have any questions, reply to this message.`
      break

    case 'custom':
      message = customMessage ?? ''
      break
  }

  if (!message) return { success: false, error: 'No message to send' }

  return sendOrgSms({ organizationId, to: customer.phone, body: message })
}
