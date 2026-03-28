import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Integrations' }

const INTEGRATIONS = [
  {
    name: 'Stripe',
    description: 'Accept credit card and ACH payments',
    icon: '/integrations/stripe.svg',
    category: 'Payments',
    connected: true,
  },
  {
    name: 'Twilio',
    description: 'Send and receive SMS messages',
    icon: '/integrations/twilio.svg',
    category: 'Communication',
    connected: true,
  },
  {
    name: 'Google Maps',
    description: 'Route optimization and dispatch mapping',
    icon: '/integrations/google-maps.svg',
    category: 'Maps',
    connected: false,
  },
  {
    name: 'QuickBooks',
    description: 'Sync invoices and expenses with accounting',
    icon: '/integrations/quickbooks.svg',
    category: 'Accounting',
    connected: false,
  },
  {
    name: 'Google Calendar',
    description: 'Sync job schedules to your calendar',
    icon: '/integrations/gcal.svg',
    category: 'Calendar',
    connected: false,
  },
  {
    name: 'Zapier',
    description: 'Connect to 5,000+ other apps',
    icon: '/integrations/zapier.svg',
    category: 'Automation',
    connected: false,
  },
]

export default function IntegrationsPage() {
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
                {int.connected && <Badge variant="success">Connected</Badge>}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{int.description}</p>
              <p className="text-xs text-gray-400 mt-0.5">{int.category}</p>
            </div>
            <Button variant={int.connected ? 'outline' : 'default'} size="sm">
              {int.connected ? 'Configure' : 'Connect'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
