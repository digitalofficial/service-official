'use client'

import { useRouter } from 'next/navigation'
import {
  TrendingUp, DollarSign, CreditCard, Clock, FileText, Percent, Banknote,
  Hammer, FolderKanban, Target, FileCheck, Users, Wrench,
} from 'lucide-react'
import { reportTemplates } from '@/lib/reports/templates'
import type { ReportCategory } from '@/lib/reports/types'

const iconMap: Record<string, any> = {
  TrendingUp, DollarSign, CreditCard, Clock, FileText, Percent, Banknote,
  Hammer, FolderKanban, Target, FileCheck, Users, Wrench,
}

const categoryLabels: Record<ReportCategory, { label: string; color: string }> = {
  financial: { label: 'Financial', color: 'text-green-700 bg-green-50 border-green-200' },
  operations: { label: 'Operations', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  labor: { label: 'Labor', color: 'text-purple-700 bg-purple-50 border-purple-200' },
}

export function ReportLibrary() {
  const router = useRouter()

  function openReport(slug: string) {
    router.push(`/reports?tab=library&slug=${slug}`)
  }

  const categories: ReportCategory[] = ['financial', 'operations', 'labor']

  return (
    <div className="space-y-8">
      {categories.map(category => {
        const templates = reportTemplates.filter(t => t.category === category)
        const { label, color } = categoryLabels[category]

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${color}`}>
                {label}
              </span>
              <span className="text-xs text-gray-400">{templates.length} reports</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map(template => {
                const Icon = iconMap[template.icon] ?? FileText
                return (
                  <button
                    key={template.slug}
                    onClick={() => openReport(template.slug)}
                    className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                        <Icon className="w-4.5 h-4.5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{template.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
