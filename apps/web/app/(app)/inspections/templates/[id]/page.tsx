import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProfile } from '@/lib/auth/get-profile'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, CheckSquare, Hash, Type, Camera, PenTool, List } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TYPE_ICONS: Record<string, any> = {
  checkbox: CheckSquare,
  pass_fail: CheckSquare,
  text: Type,
  number: Hash,
  photo: Camera,
  signature: PenTool,
  select: List,
}

const TYPE_LABELS: Record<string, string> = {
  checkbox: 'Checkbox',
  pass_fail: 'Pass / Fail',
  text: 'Text',
  number: 'Number',
  photo: 'Photo',
  signature: 'Signature',
  select: 'Select',
}

export default async function TemplateDetailPage({ params }: { params: { id: string } }) {
  const { profile, supabase } = await getProfile()

  const { data: template } = await supabase
    .from('inspection_templates')
    .select('*')
    .eq('id', params.id)
    .or(`organization_id.eq.${profile.organization_id},is_system.eq.true`)
    .single()

  if (!template) notFound()

  const { data: sections } = await supabase
    .from('template_sections')
    .select('*, items:template_items(*)')
    .eq('template_id', params.id)
    .order('order_index')

  const totalItems = (sections ?? []).reduce((sum, s: any) => sum + (s.items?.length ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/inspections" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
            {template.is_system && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">System Template</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {template.trade && <span className="capitalize">{template.trade}</span>}
            {template.category && <span className="capitalize">{template.category}</span>}
            <span>{sections?.length ?? 0} sections · {totalItems} items</span>
          </div>
        </div>
        <Link href={`/inspections?template=${template.id}`}>
          <Button><FileText className="w-4 h-4 mr-1" /> Use Template</Button>
        </Link>
      </div>

      {template.description && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.description}</p>
        </div>
      )}

      {(!sections || sections.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <p className="text-sm">This template has no sections yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section: any, si: number) => (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  <span className="text-gray-400 mr-2">{si + 1}.</span>
                  {section.name}
                </h2>
                <span className="text-xs text-gray-500">{section.items?.length ?? 0} item{section.items?.length === 1 ? '' : 's'}</span>
              </div>
              <ul className="divide-y divide-gray-100">
                {(section.items ?? [])
                  .sort((a: any, b: any) => a.order_index - b.order_index)
                  .map((item: any) => {
                    const Icon = TYPE_ICONS[item.type] ?? CheckSquare
                    return (
                      <li key={item.id} className="px-5 py-3 flex items-start gap-3">
                        <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 flex items-center gap-2 flex-wrap">
                            {item.label}
                            {item.is_required && (
                              <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Required</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span>{TYPE_LABELS[item.type] ?? item.type}</span>
                            {item.type === 'select' && item.options && (
                              <span>· {Array.isArray(item.options) ? item.options.join(', ') : JSON.parse(item.options).join(', ')}</span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                      </li>
                    )
                  })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
