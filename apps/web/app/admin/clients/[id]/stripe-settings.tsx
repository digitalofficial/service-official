'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CreditCard, Loader2, CheckCircle, DollarSign, Eye, EyeOff } from 'lucide-react'

interface PaymentStats {
  total_collected: number
  pending: number
}

interface Props {
  orgId: string
  existing: {
    stripe_publishable_key?: string | null
    stripe_secret_key?: string | null
    stripe_webhook_secret?: string | null
    stripe_account_id?: string | null
    payments_enabled?: boolean
  } | null
  paymentStats: PaymentStats
}

export function StripeSettings({ orgId, existing, paymentStats }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [enabled, setEnabled] = useState(existing?.payments_enabled ?? false)
  const [publishableKey, setPublishableKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  const hasKeys = !!(existing?.stripe_publishable_key && existing?.stripe_secret_key)

  const mask = (val: string | null | undefined) => {
    if (!val) return null
    if (val.length <= 12) return '********'
    return '********' + val.slice(-8)
  }

  const handleSave = async () => {
    setLoading(true)
    const body: Record<string, any> = {
      payments_enabled: enabled,
    }

    if (publishableKey) body.stripe_publishable_key = publishableKey
    if (secretKey) body.stripe_secret_key = secretKey
    if (webhookSecret) body.stripe_webhook_secret = webhookSecret

    const res = await fetch(`/api/admin/clients/${orgId}/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '',
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      toast.success('Stripe settings saved')
      setPublishableKey('')
      setSecretKey('')
      setWebhookSecret('')
      router.refresh()
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to save')
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-400" />
          <h2 className="font-semibold text-white">Stripe / Payments</h2>
        </div>
        <div className="flex items-center gap-3">
          {hasKeys && enabled ? (
            <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3 h-3" /> Active</span>
          ) : hasKeys ? (
            <span className="text-xs text-amber-400">Keys set, disabled</span>
          ) : (
            <span className="text-xs text-gray-500">Not configured</span>
          )}
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-gray-400">Total Collected</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(paymentStats.total_collected)}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-gray-400">Pending</span>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(paymentStats.pending)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Payments Toggle */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-300">Payments enabled for this client</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-9 h-5 bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-500/40 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>

        {/* Current keys display */}
        {hasKeys && (
          <div className="pt-2 border-t border-gray-800">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Current Keys</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Publishable</span>
                <span className="text-gray-400 font-mono">{mask(existing?.stripe_publishable_key)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Secret</span>
                <span className="text-gray-400 font-mono">{mask(existing?.stripe_secret_key)}</span>
              </div>
              {existing?.stripe_webhook_secret && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Webhook</span>
                  <span className="text-gray-400 font-mono">{mask(existing?.stripe_webhook_secret)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key inputs */}
        <div className="pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
            {hasKeys ? 'Update Keys' : 'Enter Stripe Keys'}
          </p>

          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Publishable Key</label>
              <input
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                placeholder="pk_test_..."
                className="input text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Secret Key</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="sk_test_..."
                  className="input text-sm font-mono pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Webhook Secret <span className="text-gray-600">(optional)</span></label>
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_..."
                className="input text-sm font-mono"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave} disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Stripe Settings'}
        </button>
      </div>
    </div>
  )
}
