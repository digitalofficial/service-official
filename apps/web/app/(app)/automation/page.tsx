import { getProfile } from '@/lib/auth/get-profile'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/utils'
import { Plus, Zap, Play, Pause, MoreHorizontal } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Automation' }

export default async function AutomationPage() {
  const { supabase, profile } = await getProfile()

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation"
        description="Set up rules to automate repetitive tasks"
        actions={
          <Button><Plus className="w-4 h-4 mr-2" />New Rule</Button>
        }
      />

      {!rules || rules.length === 0 ? (
        <EmptyState
          icon={<Zap className="w-12 h-12" />}
          title="No automation rules"
          description="Create rules to automatically send notifications, update statuses, and assign tasks based on triggers."
          action={<Button><Plus className="w-4 h-4 mr-2" />Create Rule</Button>}
        />
      ) : (
        <div className="space-y-3">
          {rules.map((rule: any) => (
            <div key={rule.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${rule.is_active ? 'bg-green-50' : 'bg-gray-100'}`}>
                <Zap className={`w-5 h-5 ${rule.is_active ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900">{rule.name}</h3>
                  <Badge variant={rule.is_active ? 'success' : 'secondary'}>
                    {rule.is_active ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                {rule.description && <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>}
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  <span>Trigger: <span className="text-gray-600">{rule.trigger_event?.replace(/\./g, ' ')}</span></span>
                  <span>Runs: {rule.run_count}</span>
                  {rule.last_run_at && <span>Last run: {formatDate(rule.last_run_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
