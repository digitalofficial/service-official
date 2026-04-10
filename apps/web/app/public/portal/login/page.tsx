'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, Lock } from 'lucide-react'

export default function PortalLoginRedirect() {
  return (
    <Suspense fallback={<Loading />}>
      <RedirectHandler />
    </Suspense>
  )
}

function RedirectHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const isReset = searchParams.get('reset') === 'true'

  const [showResetForm, setShowResetForm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      router.push('/auth/login?tab=customer')
      return
    }

    if (isReset) {
      // Show password reset form
      setShowResetForm(true)
      return
    }

    // Normal magic link — verify and redirect
    fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    }).then(res => {
      if (res.ok) {
        window.location.href = '/public/portal/dashboard'
      } else {
        router.push('/auth/login?tab=customer')
      }
    }).catch(() => {
      router.push('/auth/login?tab=customer')
    })
  }, [token, isReset, router])

  const handleResetPassword = async (e: React.FormEvent) => {
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

    const res = await fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set-password', token, password }),
    })

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/public/portal/dashboard'
      }, 2000)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data?.error || 'Failed to reset password. The link may have expired.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">Password Updated</h2>
          <p className="text-sm text-gray-500 mt-1">Redirecting to your portal...</p>
        </div>
      </div>
    )
  }

  if (showResetForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Set New Password</h1>
            <p className="text-sm text-gray-500 mt-1">Choose a new password for your portal account</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                autoFocus
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <Loading />
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  )
}
