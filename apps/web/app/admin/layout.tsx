import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@service-official/database'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Only super admins can access this
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization:organizations(slug)')
    .eq('id', user.id)
    .single()

  const org = profile?.organization as any
  const isSuperAdmin = org?.slug === 'service-official' && profile?.role === 'owner'

  if (!isSuperAdmin) redirect('/dashboard')

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Admin Sidebar */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-800">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-0.5">Service Official</p>
          <p className="text-sm font-semibold text-white">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {[
            { label: 'Overview', href: '/admin' },
            { label: 'Clients', href: '/admin/clients' },
            { label: 'Add Client', href: '/admin/clients/new' },
            { label: 'Revenue', href: '/admin/revenue' },
            { label: 'Settings', href: '/admin/settings' },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
