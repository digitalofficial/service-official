import Link from 'next/link'
import { getProfile } from '@/lib/auth/get-profile'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/utils'
import { Plus, ShieldAlert, AlertTriangle, CheckCircle, FileText } from 'lucide-react'

export default async function SafetyPage({ params }: { params: { id: string } }) {
  const { supabase } = await getProfile()

  // Fetch safety incidents from daily logs
  const { data: logs } = await supabase
    .from('daily_logs')
    .select('id, log_date, safety_incidents, submitter:profiles!submitted_by(first_name, last_name)')
    .eq('project_id', params.id)
    .not('safety_incidents', 'is', null)
    .order('log_date', { ascending: false })

  const incidents = (logs ?? []).filter((l: any) => l.safety_incidents && l.safety_incidents.trim().length > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Safety</h2>
        <Link href={`/projects/${params.id}/daily-logs`}>
          <Button size="sm"><Plus className="w-4 h-4 mr-1" />Report in Daily Log</Button>
        </Link>
      </div>

      {/* Safety Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-500">Status</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {incidents.length === 0 ? 'No Incidents' : `${incidents.length} Reported`}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-500">Days Without Incident</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {incidents.length === 0
              ? '--'
              : Math.floor((Date.now() - new Date(incidents[0].log_date).getTime()) / 86400000)
            }
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-500">Safety Logs</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{logs?.length ?? 0}</p>
        </div>
      </div>

      {/* Incidents */}
      {incidents.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="w-10 h-10" />}
          title="No safety incidents"
          description="Safety incidents from daily logs will appear here."
        />
      ) : (
        <div className="space-y-2">
          {incidents.map((log: any) => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{log.safety_incidents}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  <span>{formatDate(log.log_date, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {log.submitter && <span>Reported by {log.submitter.first_name} {log.submitter.last_name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
