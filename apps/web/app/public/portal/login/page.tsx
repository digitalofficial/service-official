'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

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

  useEffect(() => {
    if (token) {
      // If there's a magic link token, verify it directly via the portal auth API
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
    } else {
      // No token — redirect to unified login with customer tab
      router.push('/auth/login?tab=customer')
    }
  }, [token, router])

  return <Loading />
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  )
}
