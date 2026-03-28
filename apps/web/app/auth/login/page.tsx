'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@service-official/database/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Full page navigation so the server sees the fresh auth cookies
    window.location.href = redirect
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Sign in</h2>
        <p className="text-sm text-gray-500 mt-0.5">Enter your credentials to access your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          Get started
        </Link>
      </p>
    </div>
  )
}
