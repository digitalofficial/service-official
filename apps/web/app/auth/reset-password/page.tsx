'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@service-official/database/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Supabase sets the session from the URL hash automatically
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    // Also check if we already have a session (page refresh after click)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to dashboard after a moment
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 2000)
  }

  if (success) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Password Updated</h2>
        <p className="text-sm text-gray-500 mt-1">
          Redirecting you to the dashboard...
        </p>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900">Invalid or Expired Link</h2>
        <p className="text-sm text-gray-500 mt-1">
          This password reset link may have expired. Please request a new one.
        </p>
        <Link href="/auth/forgot-password">
          <Button className="mt-4 w-full">Request New Link</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Set New Password</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose a new password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" required>New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" required>Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
        </Button>
      </form>
    </div>
  )
}
