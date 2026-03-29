'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { UserPlus, Loader2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

const ROLE_OPTIONS = [
  { label: 'Office Manager', value: 'office_manager' },
  { label: 'Estimator', value: 'estimator' },
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

      <form onSubmit={handleInvite} className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="invite-email">Email address</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            required
          />
        </div>
        <div className="w-44 space-y-1.5">
          <Label htmlFor="invite-role">Role</Label>
          <Select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={ROLE_OPTIONS}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
        </Button>
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
