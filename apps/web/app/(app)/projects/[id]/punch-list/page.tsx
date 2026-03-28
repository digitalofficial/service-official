import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/utils'
import { Plus, ClipboardList, CheckCircle, Circle, Clock, MapPin, User } from 'lucide-react'

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-600 bg-red-50',
  normal: 'text-blue-600 bg-blue-50',
  low: 'text-gray-600 bg-gray-100',
}

export default async function PunchListPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: items } = await supabase
    .from('punch_list_items')
    .select('*, assignee:profiles!assigned_to(first_name, last_name)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  const open = (items ?? []).filter((i: any) => i.status === 'open' || i.status === 'in_progress').length
  const completed = (items ?? []).filter((i: any) => i.status === 'completed').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Punch List</h2>
          <p className="text-xs text-gray-500">{open} open, {completed} completed</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Item</Button>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-10 h-10" />}
          title="Punch list is clear"
          description="Track items that need to be fixed or completed before final walkthrough."
          action={<Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Item</Button>}
        />
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3">
              {item.status === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              ) : item.status === 'in_progress' ? (
                <Clock className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${item.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {item.title}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[item.priority] ?? ''}`}>
                    {item.priority}
                  </span>
                </div>
                {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  {item.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{item.location}</span>}
                  {item.assignee && <span className="flex items-center gap-0.5"><User className="w-3 h-3" />{item.assignee.first_name} {item.assignee.last_name}</span>}
                  {item.due_date && <span>Due {formatDate(item.due_date, { month: 'short', day: 'numeric' })}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
