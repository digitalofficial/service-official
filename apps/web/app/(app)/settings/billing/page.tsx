import { getProfile } from '@/lib/auth/get-profile'
import { CheckCircle } from 'lucide-react'
import { PlanButton, CancelPlanButton } from './billing-actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Billing Settings' }

const PLANS = [
  { tier: 'solo', name: 'Solo', price: '$29', desc: '1 user, core features', features: ['CRM + Customers', 'Projects & Jobs', 'Estimates & Invoices', 'File Storage (5GB)'] },
  { tier: 'team', name: 'Team', price: '$79', desc: 'Up to 5 users', features: ['Everything in Solo', 'Team scheduling', 'SMS messaging', 'Blueprint storage (25GB)'] },
  { tier: 'growth', name: 'Growth', price: '$149', desc: 'Up to 15 users', features: ['Everything in Team', 'AI Takeoffs', 'Automation rules', 'Client portal', 'Storage (100GB)'] },
  { tier: 'enterprise', name: 'Enterprise', price: 'Custom', desc: 'Unlimited users', features: ['Everything in Growth', 'White-label', 'API access', 'Dedicated support', 'Unlimited storage'] },
]

export default async function BillingPage() {
  const { supabase, profile } = await getProfile()

  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier, subscription_status, trial_ends_at')
    .eq('id', profile.organization_id)
    .single()
  const currentTier = org?.subscription_tier ?? 'solo'
  const currentStatus = org?.subscription_status ?? 'active'
  const isOwner = profile?.role === 'owner'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Billing & Plans</h2>
        {currentStatus === 'canceled' && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600">
            Plan Canceled
          </span>
        )}
      </div>

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

              {isOwner ? (
                <PlanButton
                  currentTier={currentTier}
                  currentStatus={currentStatus}
                  targetTier={plan.tier}
                  isEnterprise={plan.tier === 'enterprise'}
                />
              ) : isCurrent ? (
                <button disabled className="w-full h-8 px-3 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-400 cursor-not-allowed">
                  Current Plan
                </button>
              ) : (
                <button disabled className="w-full h-8 px-3 text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed">
                  Owner Only
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Cancel / Reactivate Plan */}
      {isOwner && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Subscription Management</h3>
          <p className="text-sm text-gray-500 mb-4">
            {currentStatus === 'canceled'
              ? 'Your plan has been canceled. Reactivate to regain access to premium features.'
              : 'Cancel your subscription to stop billing at the end of your current period.'}
          </p>
          <CancelPlanButton currentStatus={currentStatus} />
        </div>
      )}
    </div>
  )
}
