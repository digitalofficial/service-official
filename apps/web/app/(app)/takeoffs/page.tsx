import { createServerSupabaseClient } from '@service-official/database'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/utils'
import { Plus, Cpu, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Takeoffs' }

const STATUS_BADGE: Record<string, { variant: 'default' | 'success' | 'warning' | 'secondary'; icon: typeof Clock }> = {
  pending: { variant: 'secondary', icon: Clock },
  processing: { variant: 'default', icon: Clock },
  review: { variant: 'warning', icon: AlertCircle },
  approved: { variant: 'success', icon: CheckCircle },
}

export default async function TakeoffsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  const { data: takeoffs } = await supabase
    .from('takeoffs')
    .select(`
      *,
      blueprint:blueprints(id, name),
      project:projects(id, name),
      reviewer:profiles!reviewed_by(first_name, last_name)
    `)
    .eq('organization_id', profile!.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Takeoffs"
        description="Blueprint quantity extraction powered by AI"
        actions={<Button><Plus className="w-4 h-4 mr-2" />New Takeoff</Button>}
      />

      {!takeoffs || takeoffs.length === 0 ? (
        <EmptyState
          icon={<Cpu className="w-12 h-12" />}
          title="No takeoffs yet"
          description="Upload a blueprint and run AI-powered takeoff to extract quantities automatically."
          action={<Button><Plus className="w-4 h-4 mr-2" />Start Takeoff</Button>}
        />
      ) : (
        <div className="space-y-3">
          {takeoffs.map((to: any) => {
            const statusInfo = STATUS_BADGE[to.status] ?? STATUS_BADGE.pending
            const StatusIcon = statusInfo.icon
            return (
              <Link key={to.id} href={`/takeoffs/${to.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900">{to.name}</h3>
                    <div className="flex items-center gap-4 mt-0.5 text-xs text-gray-500">
                      {to.project && <span>{to.project.name}</span>}
                      {to.blueprint && <span>Blueprint: {to.blueprint.name}</span>}
                      {to.trade && <span className="capitalize">{to.trade}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {to.ai_confidence != null && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Confidence</p>
                        <p className={`text-sm font-bold ${to.ai_confidence >= 80 ? 'text-green-600' : to.ai_confidence >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {to.ai_confidence}%
                        </p>
                      </div>
                    )}
                    <Badge variant={statusInfo.variant}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {to.status}
                    </Badge>
                    <span className="text-xs text-gray-400">{formatDate(to.created_at, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
