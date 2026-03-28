'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Building2, Check, ArrowLeft } from 'lucide-react'

interface Org {
  id: string
  name: string
  industry?: string
  subscription_tier?: string
}

interface OrgSwitcherProps {
  currentOrgId: string
  currentOrgName: string
  isSuperAdmin: boolean
}

export function OrgSwitcher({ currentOrgId, currentOrgName, isSuperAdmin }: OrgSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(false)
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    // Check if we're impersonating (cookie set)
    const match = document.cookie.match(/so-admin-org=([^;]+)/)
    setIsImpersonating(!!match)
  }, [currentOrgId])

  const fetchOrgs = async () => {
    if (orgs.length > 0) return
    setLoading(true)
    const res = await fetch('/api/admin/orgs')
    const data = await res.json()
    setOrgs(data.data ?? [])
    setLoading(false)
  }

  const switchOrg = (orgId: string) => {
    // Set cookie to override org context
    document.cookie = `so-admin-org=${orgId}; path=/; max-age=${60 * 60 * 4}` // 4 hours
    setOpen(false)
    router.refresh()
  }

  const exitImpersonation = () => {
    // Remove the override cookie
    document.cookie = 'so-admin-org=; path=/; max-age=0'
    setOpen(false)
    router.refresh()
  }

  if (!isSuperAdmin) return null

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); fetchOrgs() }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
      >
        <Building2 className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700 max-w-[180px] truncate">{currentOrgName}</span>
        {isImpersonating && (
          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Viewing</span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden animate-slide-down">
            <div className="px-3 py-2.5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase">Switch Organization</p>
            </div>

            {isImpersonating && (
              <button
                onClick={exitImpersonation}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-purple-600 hover:bg-purple-50 border-b border-gray-100"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to my organization
              </button>
            )}

            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="py-4 text-center text-sm text-gray-400">Loading...</div>
              ) : (
                orgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => switchOrg(org.id)}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                        {org.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{org.industry?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {org.id === currentOrgId && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            <a
              href="/admin"
              className="flex items-center justify-center gap-1 py-2.5 text-xs font-medium text-blue-600 border-t border-gray-100 hover:bg-gray-50"
            >
              Open Admin Panel
            </a>
          </div>
        </>
      )}
    </div>
  )
}
