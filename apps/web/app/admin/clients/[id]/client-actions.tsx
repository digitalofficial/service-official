'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ClientActions({ org }: { org: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showTierModal, setShowTierModal] = useState(false)

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

  const isSuspended = org.subscription_status === 'paused' || org.subscription_status === 'canceled'

  return (
    <div className="flex items-center gap-2">
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
    </div>
  )
}
