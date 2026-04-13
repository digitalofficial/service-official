import Link from 'next/link'
import { Building2, Users, CreditCard, Palette, Bell, Plug, Shield, DollarSign, Upload, Globe, Hash, BookOpen } from 'lucide-react'

const SETTINGS_NAV = [
  { label: 'General', href: '/settings', icon: Building2 },
  { label: 'Team', href: '/settings/team', icon: Users },
  { label: 'Payments', href: '/settings/payments', icon: DollarSign },
  { label: 'Billing', href: '/settings/billing', icon: CreditCard },
  { label: 'Branding', href: '/settings/branding', icon: Palette },
  { label: 'Customer Portal', href: '/settings/portal', icon: Globe },
  { label: 'Notifications', href: '/settings/notifications', icon: Bell },
  { label: 'Integrations', href: '/settings/integrations', icon: Plug },
  { label: 'Cost Codes', href: '/settings/cost-codes', icon: Hash },
  { label: 'Chart of Accounts', href: '/settings/accounts', icon: BookOpen },
  { label: 'Permissions', href: '/settings/permissions', icon: Shield },
  { label: 'Import Data', href: '/settings/import', icon: Upload },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your organization settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Nav — horizontal scroll on mobile, vertical on desktop */}
        <nav className="flex lg:flex-col lg:w-48 shrink-0 gap-0.5 overflow-x-auto pb-2 lg:pb-0 border-b lg:border-b-0 border-gray-200">
          {SETTINGS_NAV.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors whitespace-nowrap"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
