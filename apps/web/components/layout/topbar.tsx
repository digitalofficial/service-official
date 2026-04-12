'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@service-official/database/client'
import { NotificationBell } from './notification-bell'
import { SupportForm } from './support-form'
import { ThemeToggle } from './theme-toggle'
import { LogOut, Settings, ChevronDown, HelpCircle, BookOpen, Mail, Sun, Moon, Lightbulb, ChevronRight } from 'lucide-react'
import { useFeatureGuide, FEATURE_TOUR_LIST } from './feature-guides'

interface TopBarProps {
  profile: any
}

export function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [guidesOpen, setGuidesOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const { startTour: startFeatureTour } = useFeatureGuide()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const startTour = () => {
    setHelpOpen(false)
    setMenuOpen(false)
    localStorage.removeItem('so-tour-done')
    window.dispatchEvent(new CustomEvent('start-tour'))
  }

  const openSupport = () => {
    setHelpOpen(false)
    setMenuOpen(false)
    setSupportOpen(true)
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Desktop only: theme toggle + help */}
      <div className="hidden sm:block">
        <ThemeToggle />
      </div>

      <div className="relative hidden sm:block">
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
              <div className="relative">
                <button
                  onClick={() => setGuidesOpen(!guidesOpen)}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <div className="text-left">
                      <p className="font-medium">Feature Guides</p>
                      <p className="text-xs text-gray-400">Learn how each feature works</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${guidesOpen ? 'rotate-90' : ''}`} />
                </button>
                {guidesOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 max-h-64 overflow-y-auto">
                    {FEATURE_TOUR_LIST.map(item => (
                      <button
                        key={item.key}
                        onClick={() => { startFeatureTour(item.key); setHelpOpen(false); setGuidesOpen(false) }}
                        className="w-full px-5 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

      {/* Profile dropdown — includes help/theme on mobile */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-slide-down">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              </div>
              <a href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Settings className="w-4 h-4" /> Settings
              </a>

              {/* Mobile only: theme, help, support */}
              <div className="sm:hidden border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button
                  onClick={startTour}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <BookOpen className="w-4 h-4" /> Guided Tour
                </button>
                <button
                  onClick={openSupport}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Mail className="w-4 h-4" /> Contact Support
                </button>
              </div>

              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Support ticket modal */}
      {supportOpen && <SupportForm onClose={() => setSupportOpen(false)} />}
    </div>
  )
}
