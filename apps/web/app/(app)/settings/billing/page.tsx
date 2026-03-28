import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Billing Settings' }

const PLANS = [
  { tier: 'solo', name: 'Solo', price: '$29', desc: '1 user, core features', features: ['CRM + Customers', 'Projects & Jobs', 'Estimates & Invoices', 'File Storage (5GB)'] },
  { tier: 'team', name: 'Team', price: '$79', desc: 'Up to 5 users', features: ['Everything in Solo', 'Team scheduling', 'SMS messaging', 'Blueprint storage (25GB)'] },
  { tier: 'growth', name: 'Growth', price: '$149', desc: 'Up to 15 users', features: ['Everything in Team', 'AI Takeoffs', 'Automation rules', 'Client portal', 'Storage (100GB)'] },
  { tier: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'Unlimited users', features: ['Everything in Growth', 'White-label', 'API access', 'Dedicated support', 'Unlimited storage'] },
]

export default async function BillingPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization:organizations(subscription_tier, subscription_status, trial_ends_at)')
    .eq('id', user!.id)
    .single()

  const org = (profile as any)?.organization
  const currentTier = org?.subscription_tier ?? 'solo'

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-900">Billing & Plans</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.tier === currentTier
          return (
            <div
              key={plan.tier}
              className={`rounded-xl border p-5 ${
                isCurrent ? 'border-blue-300 bg-blue-50/50 ring-1 ring-blue-300' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {plan.price}<span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{plan.desc}</p>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="outline" size="sm" className="w-full" disabled>Current Plan</Button>
              ) : (
                <Button variant={plan.tier === 'enterprise' ? 'outline' : 'default'} size="sm" className="w-full">
                  {plan.tier === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
