'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@service-official/database/client'

export function DangerZone({ orgName }: { orgName: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirmText !== orgName) {
      toast.error('Organization name does not match')
      return
    }

    setDeleting(true)
    try {
      const res = await fetch('/api/settings/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_name: confirmText }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to delete account')
      }

      toast.success('Account deleted successfully')

      // Sign out and redirect
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-red-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h2 className="text-base font-semibold text-red-600">Danger Zone</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Permanently delete your organization and all associated data. This includes all team members,
        jobs, invoices, files, and settings. <strong>This action cannot be undone.</strong>
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          Delete Account
        </button>
      ) : (
        <div className="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">
            To confirm, type your organization name: <strong>{orgName}</strong>
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={orgName}
            className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting || confirmText !== orgName}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {deleting ? 'Deleting...' : 'Permanently Delete'}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setConfirmText('') }}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
