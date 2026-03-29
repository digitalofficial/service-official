import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Integrations' }

export default async function IntegrationsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id, organization:organizations(stripe_customer_id, stripe_subscription_id)').eq('id', user!.id).single()

  // Check if Twilio is configured
  const { data: smsSettings } = await supabase
    .from('organization_sms_settings')
    .select('is_enabled, twilio_account_sid')
    .eq('organization_id', profile!.organization_id)
    .single()

  const twilioConnected = !!(smsSettings?.is_enabled && smsSettings?.twilio_account_sid)
  const org = (profile as any)?.organization
  const stripeConnected = !!(org?.stripe_customer_id || org?.stripe_subscription_id)

  const INTEGRATIONS = [
    {
      name: 'Stripe',
      description: 'Accept credit card and ACH payments',
      category: 'Payments',
      connected: stripeConnected,
      href: '/settings/billing',
    },
    {
      name: 'Twilio',
      description: 'Send and receive SMS messages + job reminders',
      category: 'Communication',
      connected: twilioConnected,
      href: '/settings/sms',
    },
    {
      name: 'Google Maps',
      description: 'Route optimization and dispatch mapping',
      category: 'Maps',
      connected: false,
      href: null,
    },
    {
      name: 'QuickBooks',
      description: 'Sync invoices and expenses with accounting',
      category: 'Accounting',
      connected: false,
      href: null,
    },
    {
      name: 'Google Calendar',
      description: 'Sync job schedules to your calendar',
      category: 'Calendar',
      connected: false,
      href: null,
    },
    {
      name: 'Zapier',
      description: 'Connect to 5,000+ other apps',
      category: 'Automation',
      connected: false,
      href: null,
    },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-900">Integrations</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((int) => (
          <div key={int.name} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-sm font-bold text-gray-500">
              {int.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{int.name}</h3>
                {int.connected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="secondary">Not connected</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{int.description}</p>
              <p className="text-xs text-gray-400 mt-0.5">{int.category}</p>
            </div>
            {int.href ? (
              <Link href={int.href}>
                <Button variant={int.connected ? 'outline' : 'default'} size="sm">
                  {int.connected ? 'Configure' : 'Set Up'}
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
