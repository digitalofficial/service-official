'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AcceptInvitePage() {
  return <Suspense><AcceptInviteForm /></Suspense>
}

function AcceptInviteForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orgName, setOrgName] = useState('')

  if (!token) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Invalid Invitation</h2>
        <p className="text-sm text-gray-500 mt-1">This invite link is missing or invalid.</p>
        <Link href="/auth/login">
          <Button variant="outline" className="mt-4">Go to Login</Button>
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const res = await fetch('/api/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, first_name: firstName, last_name: lastName }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to accept invitation')
      setLoading(false)
      return
    }

    setOrgName(data.organization ?? '')
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Welcome aboard!</h2>
        <p className="text-sm text-gray-500 mt-1">
          Your account has been created{orgName ? ` for ${orgName}` : ''}. You can now sign in.
        </p>
        <Link href="/auth/login">
          <Button className="mt-4 w-full">Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Accept Invitation</h2>
        <p className="text-sm text-gray-500 mt-0.5">Set up your account to join the team</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName" required>First name</Label>
            <Input
              id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)}
              placeholder="John" required autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName" required>Last name</Label>
            <Input
              id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith" required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" required>Create a password</Label>
          <Input
            id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters" required autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account & Join'}
        </Button>
      </form>
    </div>
  )
}
