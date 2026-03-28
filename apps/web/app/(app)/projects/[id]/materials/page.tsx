import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, statusColor } from '@/lib/utils'
import { Plus, Package, Truck } from 'lucide-react'

export default async function ProjectMaterialsPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: materials } = await supabase
    .from('project_materials')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  const totalCost = (materials ?? []).reduce((sum: number, m: any) => sum + (m.total_cost ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Materials ({materials?.length ?? 0})</h2>
          {totalCost > 0 && <p className="text-xs text-gray-500">Total: {formatCurrency(totalCost)}</p>}
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Material</Button>
      </div>

      {!materials || materials.length === 0 ? (
        <EmptyState
          icon={<Package className="w-10 h-10" />}
          title="No materials tracked"
          description="Track materials, quantities, and costs for this project."
          action={<Button size="sm"><Plus className="w-4 h-4 mr-1" />Add</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left font-medium text-gray-500 px-4 py-2.5">Material</th>
                <th className="text-left font-medium text-gray-500 px-4 py-2.5">Supplier</th>
                <th className="text-center font-medium text-gray-500 px-4 py-2.5">Qty</th>
                <th className="text-center font-medium text-gray-500 px-4 py-2.5">Received</th>
                <th className="text-right font-medium text-gray-500 px-4 py-2.5">Cost</th>
                <th className="text-left font-medium text-gray-500 px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map((m: any) => {
                const colors = statusColor(m.status)
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{m.name}</p>
                      {m.category && <p className="text-xs text-gray-500 capitalize">{m.category}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{m.supplier ?? '--'}</td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {m.quantity_ordered} {m.unit}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {m.quantity_received}/{m.quantity_ordered}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {m.total_cost ? formatCurrency(m.total_cost) : '--'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
