'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@service-official/database/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, HardHat, User, Mail, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'
  const registered = searchParams.get('registered') === 'true'
  const setupFailed = searchParams.get('error') === 'setup_failed'
  const initialTab = searchParams.get('tab') === 'customer' ? 'customer' : 'contractor'

  const [tab, setTab] = useState<'contractor' | 'customer'>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Customer-specific state
  const [customerMode, setCustomerMode] = useState<'password' | 'magic-link'>('password')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const switchTab = (newTab: 'contractor' | 'customer') => {
    setTab(newTab)
    setError('')
    setEmail('')
    setPassword('')
    setMagicLinkSent(false)
    setCustomerMode('password')
  }

  // Contractor login — Supabase auth
  const handleContractorLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    window.location.href = redirect
  }

  // Customer password login — portal auth
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    })

    if (res.ok) {
      window.location.href = '/public/portal/dashboard'
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data?.error || 'Invalid email or password')
    }
    setLoading(false)
  }

  // Customer magic link
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'magic-link', email }),
    })

    if (res.ok) {
      setMagicLinkSent(true)
    } else {
      setError('Failed to send login link. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => switchTab('contractor')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
            tab === 'contractor'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <HardHat className="w-4 h-4" />
          Contractor / Team
        </button>
        <button
          onClick={() => switchTab('customer')}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
            tab === 'customer'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <User className="w-4 h-4" />
          Customer
        </button>
      </div>

      <div className="p-6">
        {/* Banner messages */}
        {registered && tab === 'contractor' && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 mb-4">
            Account created successfully! Sign in to get started.
          </div>
        )}
        {setupFailed && tab === 'contractor' && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700 mb-4">
            There was a problem setting up your account. Please sign in and we'll try again, or contact support.
          </div>
        )}

        {/* ── Contractor / Team Login ── */}
        {tab === 'contractor' && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Sign in</h2>
              <p className="text-sm text-gray-500 mt-0.5">Access your contractor dashboard</p>
            </div>

            <form onSubmit={handleContractorLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" required>Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" required>Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
                Start free trial
              </Link>
            </p>
          </>
        )}

        {/* ── Customer Login ── */}
        {tab === 'customer' && (
          <>
            {magicLinkSent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a login link to <strong>{email}</strong>
                </p>
                <button onClick={() => setMagicLinkSent(false)} className="mt-4 text-sm text-blue-600 hover:underline">
                  Try a different email
                </button>
              </div>
            ) : customerMode === 'password' ? (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Customer Sign In</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Access your projects, invoices, and documents</p>
                </div>

                <form onSubmit={handleCustomerLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-email" required>Email</Label>
                    <Input
                      id="c-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="c-password" required>Password</Label>
                    <Input
                      id="c-password"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
                  </Button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">or</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setCustomerMode('magic-link'); setError('') }}
                    className="w-full py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Sign in with email link
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <button
                    onClick={() => { setCustomerMode('password'); setError('') }}
                    className="text-sm text-gray-500 hover:text-gray-700 mb-3 inline-block"
                  >
                    ← Back to password login
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900">Email Login Link</h2>
                  <p className="text-sm text-gray-500 mt-0.5">We'll send a secure link to your email</p>
                </div>

                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ml-email" required>Email</Label>
                    <Input
                      id="ml-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send login link'}
                  </Button>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
