'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const TIER_ORDER = ['solo', 'team', 'growth', 'enterprise']

interface BillingActionsProps {
  currentTier: string
  currentStatus: string
  targetTier: string
  isEnterprise: boolean
}

export function PlanButton({ currentTier, currentStatus, targetTier, isEnterprise }: BillingActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isCurrent = targetTier === currentTier
  const currentIdx = TIER_ORDER.indexOf(currentTier)
  const targetIdx = TIER_ORDER.indexOf(targetTier)
  const isDowngrade = targetIdx < currentIdx
  const isCanceled = currentStatus === 'canceled'

  const handleChangePlan = async () => {
    if (isEnterprise) return // Contact sales

    const action = isDowngrade ? 'downgrade' : 'upgrade'
    if (isDowngrade && !confirm(`Are you sure you want to downgrade to ${targetTier}? You may lose access to features in your current plan.`)) return

    setLoading(true)
    try {
      const res = await fetch('/api/settings/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_tier: targetTier,
          ...(isCanceled ? { subscription_status: 'active' } : {}),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success(`Plan ${action}d to ${targetTier}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to change plan')
    } finally {
      setLoading(false)
    }
  }

  if (isCurrent) {
    return (
      <button
        disabled
        className="w-full h-8 px-3 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-400 cursor-not-allowed"
      >
        Current Plan
      </button>
    )
  }

  if (isEnterprise) {
    return (
      <button
        className="w-full h-8 px-3 text-xs font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Contact Sales
      </button>
    )
  }

  return (
    <button
      onClick={handleChangePlan}
      disabled={loading}
      className={`w-full h-8 px-3 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1 ${
        isDowngrade
          ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
      }`}
    >
      {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      {isDowngrade ? 'Downgrade' : 'Upgrade'}
    </button>
  )
}

export function CancelPlanButton({ currentStatus }: { currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isCanceled = currentStatus === 'canceled'

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your plan? You will lose access to premium features at the end of your billing period.')) return

    setLoading(true)
    try {
      const res = await fetch('/api/settings/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_status: 'canceled' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success('Plan canceled')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to cancel plan')
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_status: 'active' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast.success('Plan reactivated')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to reactivate plan')
    } finally {
      setLoading(false)
    }
  }

  if (isCanceled) {
    return (
      <button
        onClick={handleReactivate}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Reactivate Plan
      </button>
    )
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      Cancel Plan
    </button>
  )
}
