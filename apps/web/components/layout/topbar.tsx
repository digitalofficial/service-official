'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@service-official/database/client'
import { NotificationBell } from './notification-bell'
import { SupportForm } from './support-form'
import { ThemeToggle } from './theme-toggle'
import { LogOut, Settings, ChevronDown, HelpCircle, BookOpen, Mail } from 'lucide-react'

interface TopBarProps {
  profile: any
}

export function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const startTour = () => {
    setHelpOpen(false)
    localStorage.removeItem('so-tour-done')
    window.dispatchEvent(new CustomEvent('start-tour'))
  }

  const openSupport = () => {
    setHelpOpen(false)
    setSupportOpen(true)
  }

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />

      {/* Help dropdown */}
      <div className="relative">
        <button
          onClick={() => setHelpOpen(!helpOpen)}
          data-tour="help"
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Help & Support"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {helpOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setHelpOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-slide-down">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Help & Support</p>
              </div>
              <button
                onClick={startTour}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium">Guided Tour</p>
                  <p className="text-xs text-gray-400">Walk through the basics</p>
                </div>
              </button>
              <button
                onClick={openSupport}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-4 h-4 text-green-500" />
                <div className="text-left">
                  <p className="font-medium">Contact Support</p>
                  <p className="text-xs text-gray-400">Submit a support ticket</p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      <NotificationBell />

      {/* Profile dropdown */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-slide-down">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
              </div>
              <a href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Settings className="w-4 h-4" /> Settings
              </a>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>

      {/* Support ticket modal */}
      {supportOpen && <SupportForm onClose={() => setSupportOpen(false)} />}
    </div>
  )
}
