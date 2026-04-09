'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut, FolderKanban, Receipt, Home, FileText } from 'lucide-react'

interface PortalSession {
  id: string
  email: string
  customer_id: string
  organization_id: string
  customer: any
}

const PortalContext = createContext<{ session: PortalSession | null; loading: boolean }>({ session: null, loading: true })
export const usePortalSession = () => useContext(PortalContext)

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<PortalSession | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === '/public/portal/login'

  useEffect(() => {
    if (isLoginPage) { setLoading(false); return }
    checkSession()
  }, [pathname])

  async function checkSession() {
    const res = await fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'session' }),
    })
    if (res.ok) {
      const data = await res.json()
      setSession(data.portal_user)
    } else {
      router.push('/public/portal/login')
    }
    setLoading(false)
  }

  async function handleLogout() {
    await fetch('/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })
    router.push('/public/portal/login')
  }

  if (isLoginPage) return <>{children}</>

  const org = session?.customer?.organization
  const primaryColor = org?.primary_color || '#2563eb'
  const customerName = session?.customer
    ? (session.customer.company_name || `${session.customer.first_name} ${session.customer.last_name}`)
    : ''

  return (
    <PortalContext.Provider value={{ session, loading }}>
      <div className="min-h-screen bg-gray-50" style={{ '--portal-primary': primaryColor } as any}>
        {/* Header */}
        {session && (
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {org?.logo_url && (
                  <Image src={org.logo_url} alt={org.name} width={28} height={28} className="rounded" />
                )}
                <span className="font-semibold text-gray-900">{org?.name || 'Client Portal'}</span>
              </div>
              <div className="flex items-center gap-4">
                <nav className="flex items-center gap-1">
                  <Link href="/public/portal/dashboard" className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${pathname === '/public/portal/dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Home className="w-4 h-4 inline mr-1.5" />Dashboard
                  </Link>
                  <Link href="/public/portal/estimates" className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${pathname.startsWith('/public/portal/estimates') ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    <FileText className="w-4 h-4 inline mr-1.5" />Estimates
                  </Link>
                  <Link href="/public/portal/invoices" className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${pathname.startsWith('/public/portal/invoices') ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Receipt className="w-4 h-4 inline mr-1.5" />Invoices
                  </Link>
                </nav>
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-500">{customerName}</span>
                  <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </PortalContext.Provider>
  )
}
