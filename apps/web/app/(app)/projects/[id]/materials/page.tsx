import { getProfile } from '@/lib/auth/get-profile'
import { EmptyState } from '@/components/ui/empty-state'
import { AddItemForm } from '@/components/projects/add-item-form'
import { ItemActions } from '@/components/projects/item-actions'
import { formatCurrency, statusColor } from '@/lib/utils'
import { Package } from 'lucide-react'

const MATERIAL_STATUSES = [
  { value: 'pending', label: 'Pending' }, { value: 'ordered', label: 'Ordered' },
  { value: 'received', label: 'Received' }, { value: 'installed', label: 'Installed' },
]

const FIELDS = [
  { name: 'name', label: 'Material', type: 'text' as const, placeholder: 'e.g. Architectural Shingles', required: true, colSpan: 2 },
  { name: 'category', label: 'Category', type: 'text' as const, placeholder: 'e.g. roofing' },
  { name: 'supplier', label: 'Supplier', type: 'text' as const, placeholder: 'e.g. Home Depot' },
  { name: 'quantity_estimated', label: 'Qty Needed', type: 'number' as const, placeholder: '0', step: '0.01' },
  { name: 'unit', label: 'Unit', type: 'text' as const, placeholder: 'e.g. squares, lbs, ft' },
  { name: 'unit_cost', label: 'Unit Cost ($)', type: 'number' as const, placeholder: '0.00', step: '0.01' },
  { name: 'status', label: 'Status', type: 'select' as const, defaultValue: 'pending', options: [
    { label: 'Pending', value: 'pending' }, { label: 'Ordered', value: 'ordered' },
    { label: 'Received', value: 'received' }, { label: 'Installed', value: 'installed' },
  ]},
]

export default async function ProjectMaterialsPage({ params }: { params: { id: string } }) {
  const { supabase } = await getProfile()
  const { data: materials } = await supabase.from('project_materials').select('*').eq('project_id', params.id).order('created_at', { ascending: false })
  const totalCost = (materials ?? []).reduce((sum: number, m: any) => sum + (m.total_cost ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Materials ({materials?.length ?? 0})</h2>
          {totalCost > 0 && <p className="text-xs text-gray-500">Total: {formatCurrency(totalCost)}</p>}
        </div>
        <AddItemForm projectId={params.id} itemType="material" buttonLabel="Add Material" formTitle="New Material" fields={FIELDS} />
      </div>

      {!materials || materials.length === 0 ? (
        <EmptyState icon={<Package className="w-10 h-10" />} title="No materials tracked" description="Track materials, quantities, and costs for this project."
          action={<AddItemForm projectId={params.id} itemType="material" buttonLabel="Add" formTitle="New Material" fields={FIELDS} />} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left font-medium text-gray-500 px-4 py-2.5">Material</th>
                <th className="text-left font-medium text-gray-500 px-4 py-2.5">Supplier</th>
                <th className="text-center font-medium text-gray-500 px-4 py-2.5">Qty</th>
                <th className="text-right font-medium text-gray-500 px-4 py-2.5">Cost</th>
                <th className="text-left font-medium text-gray-500 px-4 py-2.5">Status</th>
                <th className="text-right font-medium text-gray-500 px-4 py-2.5">Actions</th>
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
                    <td className="px-4 py-3 text-center text-gray-700">{m.quantity_estimated} {m.unit}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {m.unit_cost && m.quantity_estimated ? formatCurrency(m.unit_cost * m.quantity_estimated) : '--'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ItemActions itemId={m.id} itemType="material" currentStatus={m.status} statuses={MATERIAL_STATUSES} />
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
