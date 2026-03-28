import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatDate, statusColor } from '@/lib/utils'
import { Plus, FileEdit, DollarSign, Clock } from 'lucide-react'

export default async function ChangeOrdersPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: orders } = await supabase
    .from('change_orders')
    .select('*, approver:profiles!approved_by(first_name, last_name)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  const totalApproved = (orders ?? [])
    .filter((o: any) => o.status === 'approved')
    .reduce((sum: number, o: any) => sum + (o.approved_amount ?? o.amount ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Change Orders ({orders?.length ?? 0})</h2>
          {totalApproved !== 0 && <p className="text-xs text-gray-500">Approved total: {formatCurrency(totalApproved)}</p>}
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />New CO</Button>
      </div>

      {!orders || orders.length === 0 ? (
        <EmptyState
          icon={<FileEdit className="w-10 h-10" />}
          title="No change orders"
          description="Change orders track scope and cost modifications."
          action={<Button size="sm"><Plus className="w-4 h-4 mr-1" />Create</Button>}
        />
      ) : (
        <div className="space-y-2">
          {orders.map((co: any) => {
            const colors = statusColor(co.status)
            return (
              <div key={co.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {co.co_number && <span className="text-xs text-gray-400">{co.co_number}</span>}
                    <h3 className="text-sm font-medium text-gray-900">{co.title}</h3>
                  </div>
                  {co.reason && <p className="text-xs text-gray-500 mt-0.5">{co.reason}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span>{formatDate(co.created_at, { month: 'short', day: 'numeric' })}</span>
                    {co.schedule_days_impact !== 0 && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {co.schedule_days_impact > 0 ? '+' : ''}{co.schedule_days_impact} days
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${co.amount >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {co.amount >= 0 ? '+' : ''}{formatCurrency(co.amount)}
                  </p>
                  {co.approved_amount != null && co.status === 'approved' && (
                    <p className="text-xs text-green-600">Approved: {formatCurrency(co.approved_amount)}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${colors.bg} ${colors.text}`}>
                  {co.status}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
