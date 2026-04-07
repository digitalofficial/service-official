'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserPlus, Loader2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

const ROLE_OPTIONS = [
  { label: 'Admin', value: 'admin' },
  { label: 'Office Manager', value: 'office_manager' },
  { label: 'Project Manager', value: 'project_manager' },
  { label: 'Foreman', value: 'foreman' },
  { label: 'Technician', value: 'technician' },
  { label: 'Dispatcher', value: 'dispatcher' },
  { label: 'Subcontractor', value: 'subcontractor' },
  { label: 'Viewer', value: 'viewer' },
]

export function InviteForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('technician')
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setInviteUrl('')

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to send invitation')
      setLoading(false)
      return
    }

    setInviteUrl(data.invite_url)
    toast.success(`Invitation sent to ${email}`)
    setEmail('')
    setLoading(false)
    router.refresh()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    toast.success('Invite link copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <UserPlus className="w-4 h-4" /> Invite Team Member
      </h3>

      <form onSubmit={handleInvite} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600">Email address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              required
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-400"
            >
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}
            Send Invite
          </Button>
        </div>
      </form>

      {inviteUrl && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700 font-medium mb-2">Invite link (share with the team member):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-green-200 rounded px-2 py-1.5 text-green-800 truncate">
              {inviteUrl}
            </code>
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
