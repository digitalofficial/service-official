'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'

export default function PortalLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}>
      <PortalLoginContent />
    </Suspense>
  )
}

function PortalLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenParam = searchParams.get('token')

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(!!tokenParam)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tokenParam) verifyToken(tokenParam)
  }, [tokenParam])

  async function verifyToken(token: string) {
    setVerifying(true)
    const res = await fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    })
    if (res.ok) {
      router.push('/public/portal/dashboard')
    } else {
      const data = await res.json()
      setError(data.error || 'Invalid or expired link')
      setVerifying(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'magic-link', email }),
    })
    setLoading(false)
    if (res.ok) {
      setSent(true)
    } else {
      setError('Failed to send login link')
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying your login link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Client Portal</h1>
            <p className="text-gray-500">Access your projects, invoices, and documents</p>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500">
                We sent a login link to <strong>{email}</strong>. Click the link in the email to sign in.
              </p>
              <button onClick={() => setSent(false)} className="mt-6 text-sm text-blue-600 hover:underline">
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {loading ? 'Sending...' : 'Send Login Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
