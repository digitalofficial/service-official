import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@service-official/database'
import { AdminSidebar } from './admin-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization:organizations(slug)')
    .eq('id', user.id)
    .single()

  const org = profile?.organization as any
  const isSuperAdmin = org?.slug === 'service-official' && profile?.role === 'owner'

  if (!isSuperAdmin) redirect('/dashboard')

  return (
    <div className="flex h-[100dvh] bg-gray-950 text-white overflow-hidden max-w-[100vw]">
      <AdminSidebar email={user.email ?? ''} />
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
