import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Plus, Users, Mail, Phone, Clock } from 'lucide-react'
import { formatPhone, formatDate } from '@/lib/utils'
import { InviteForm } from './invite-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Team Settings' }

export default async function TeamSettingsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user!.id).single()

  const isOwnerOrAdmin = profile?.role === 'owner' || profile?.role === 'admin'

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', profile!.organization_id)
    .order('created_at', { ascending: true })

  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('organization_id', profile!.organization_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const ROLE_COLORS: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
    owner: 'success',
    admin: 'default',
    office_manager: 'warning',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Team Members</h2>
      </div>

      {/* Invite Form (owners/admins only) */}
      {isOwnerOrAdmin && <InviteForm />}

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending Invitations ({invitations.length})
          </h3>
          <div className="space-y-2">
            {invitations.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                  <p className="text-xs text-gray-500">
                    Invited {formatDate(inv.created_at, { month: 'short', day: 'numeric' })} — expires {formatDate(inv.expires_at, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <Badge variant="warning">{inv.role?.replace('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      {!members || members.length === 0 ? (
        <EmptyState icon={<Users className="w-12 h-12" />} title="No team members" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                {m.first_name?.[0]}{m.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{m.first_name} {m.last_name}</p>
                  <Badge variant={ROLE_COLORS[m.role] ?? 'secondary'}>
                    {m.role?.replace('_', ' ')}
                  </Badge>
                  {!m.is_active && <Badge variant="destructive">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-4 mt-0.5 text-xs text-gray-500">
                  {m.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</span>}
                  {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{formatPhone(m.phone)}</span>}
                  {m.title && <span>{m.title}</span>}
                </div>
              </div>
              {isOwnerOrAdmin && m.role !== 'owner' && (
                <Button variant="ghost" size="sm">Edit</Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
