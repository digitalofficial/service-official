'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ClientActions({ org }: { org: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showTierModal, setShowTierModal] = useState(false)
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [trialDate, setTrialDate] = useState(
    org.trial_ends_at ? new Date(org.trial_ends_at).toISOString().split('T')[0] : ''
  )

  const updateOrg = async (updates: Record<string, any>, action: string) => {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/clients/${org.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '',
        },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Updated successfully')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  const handleSuspend = () => {
    if (!confirm(`Suspend ${org.name}? They will lose access immediately.`)) return
    updateOrg({ subscription_status: 'paused' }, 'suspend')
  }

  const handleReactivate = () => {
    updateOrg({ subscription_status: 'active' }, 'reactivate')
  }

  const handleLoginAs = async () => {
    setLoading('login')
    try {
      const res = await fetch(`/api/admin/clients/${org.id}/login-as`, {
        method: 'POST',
        headers: { 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Open their app in new tab with magic link
      window.open(data.magic_link, '_blank')
    } catch (err: any) {
      toast.error(err.message ?? 'Could not generate login link')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${org.name}"? This will remove ALL data including users, jobs, invoices, and files. This cannot be undone.`)) return
    if (!confirm(`FINAL WARNING: This will permanently delete ${org.name} and all associated data. Type OK in the next prompt to continue.`)) return

    setLoading('delete')
    try {
      const res = await fetch(`/api/admin/clients/${org.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '',
        },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to delete')
      }
      toast.success('Organization deleted permanently')
      router.push('/admin/clients')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete organization')
    } finally {
      setLoading(null)
    }
  }

  const isSuspended = org.subscription_status === 'paused' || org.subscription_status === 'canceled'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Login As */}
      <button
        onClick={handleLoginAs}
        disabled={loading === 'login'}
        className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading === 'login' ? 'Loading...' : '🔑 Login As'}
      </button>

      {/* Change Tier */}
      <div className="relative">
        <button
          onClick={() => setShowTierModal(!showTierModal)}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Change Plan
        </button>
        {showTierModal && (
          <div className="absolute right-0 top-10 bg-gray-800 border border-gray-700 rounded-xl p-3 w-48 z-10 shadow-xl">
            {['solo', 'team', 'growth', 'enterprise'].map(tier => (
              <button
                key={tier}
                onClick={() => { updateOrg({ subscription_tier: tier }, 'tier'); setShowTierModal(false) }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg capitalize transition-colors ${org.subscription_tier === tier ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                {tier}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Trial Management */}
      <div className="relative">
        <button
          onClick={() => setShowTrialModal(!showTrialModal)}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Trial
        </button>
        {showTrialModal && (
          <div className="absolute right-0 top-10 bg-gray-800 border border-gray-700 rounded-xl p-4 w-64 z-10 shadow-xl space-y-3">
            <p className="text-xs text-gray-400 font-medium">Trial End Date</p>
            <input
              type="date"
              value={trialDate}
              onChange={e => setTrialDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-600 rounded-lg text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!trialDate) return
                  updateOrg({
                    trial_ends_at: new Date(trialDate + 'T23:59:59Z').toISOString(),
                    subscription_status: 'trialing',
                  }, 'trial')
                  setShowTrialModal(false)
                }}
                disabled={!trialDate || loading === 'trial'}
                className="flex-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading === 'trial' ? 'Saving...' : 'Set Trial'}
              </button>
              <button
                onClick={() => {
                  updateOrg({ trial_ends_at: null, subscription_status: 'active' }, 'trial')
                  setShowTrialModal(false)
                  setTrialDate('')
                }}
                disabled={loading === 'trial'}
                className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                End Trial
              </button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[7, 14, 30, 60].map(days => (
                <button
                  key={days}
                  onClick={() => {
                    const d = new Date()
                    d.setDate(d.getDate() + days)
                    setTrialDate(d.toISOString().split('T')[0])
                  }}
                  className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                >
                  +{days}d
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suspend / Reactivate */}
      {isSuspended ? (
        <button
          onClick={handleReactivate}
          disabled={loading === 'reactivate'}
          className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          Reactivate
        </button>
      ) : (
        <button
          onClick={handleSuspend}
          disabled={loading === 'suspend'}
          className="px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded-lg disabled:opacity-50 transition-colors"
        >
          Suspend
        </button>
      )}

      {/* Delete Client */}
      <button
        onClick={handleDelete}
        disabled={loading === 'delete'}
        className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading === 'delete' ? 'Deleting...' : 'Delete Client'}
      </button>
    </div>
  )
}
