'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, X, Loader2 } from 'lucide-react'

export function AddOwnerButton({ orgId }: { orgId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const handleAdd = async () => {
    if (!email || !firstName || !lastName) {
      toast.error('Fill in all fields')
      return
    }

    setLoading(true)
    const res = await fetch(`/api/admin/clients/${orgId}/add-owner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '',
      },
      body: JSON.stringify({ email, first_name: firstName, last_name: lastName }),
    })

    const data = await res.json()
    if (res.ok) {
      toast.success(`Owner added: ${email} — temp password: ${data.temp_password}`)
      setEmail('')
      setFirstName('')
      setLastName('')
      setOpen(false)
      router.refresh()
    } else {
      toast.error(data.error ?? 'Failed to add owner')
    }
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
      >
        <Plus className="w-3 h-3" /> Add Owner
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 bg-gray-800 border border-gray-700 rounded-xl p-4 z-50 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Add Owner</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name" className="input text-sm"
              />
              <input
                value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name" className="input text-sm"
              />
            </div>
            <input
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@company.com" type="email" className="input text-sm"
            />
            <p className="text-xs text-gray-500">Creates an auth account with a temp password and assigns owner role.</p>
            <button
              onClick={handleAdd} disabled={loading}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Owner Account'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
