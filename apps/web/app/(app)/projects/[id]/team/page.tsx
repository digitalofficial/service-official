import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Plus, Users, Mail, Phone } from 'lucide-react'

export default async function ProjectTeamPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: members } = await supabase
    .from('project_team')
    .select('*, profile:profiles(*)')
    .eq('project_id', params.id)
    .order('assigned_at', { ascending: true })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Team ({members?.length ?? 0})</h2>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Member</Button>
      </div>

      {!members || members.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10" />}
          title="No team assigned"
          description="Add team members to this project."
          action={<Button size="sm"><Plus className="w-4 h-4 mr-1" />Add</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {members.map((m: any) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                {m.profile?.first_name?.[0]}{m.profile?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{m.profile?.first_name} {m.profile?.last_name}</p>
                <p className="text-xs text-gray-500 capitalize">{m.role ?? m.profile?.role?.replace('_', ' ')}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {m.profile?.email && <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" />{m.profile.email}</span>}
                  {m.profile?.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{m.profile.phone}</span>}
                </div>
              </div>
              {m.hourly_rate && (
                <span className="text-xs font-medium text-gray-500">{formatCurrency(m.hourly_rate)}/hr</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
