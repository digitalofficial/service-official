'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, FileText, Save } from 'lucide-react'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  content: string
  type: string
}

interface TermsTemplateSelectProps {
  type: 'estimate' | 'invoice'
  value: string
  onChange: (value: string) => void
}

export function TermsTemplateSelect({ type, value, onChange }: TermsTemplateSelectProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTemplates()
  }, [type])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchTemplates() {
    try {
      const res = await fetch(`/api/settings/terms-templates?type=${type}`)
      if (res.ok) {
        const { data } = await res.json()
        setTemplates(data || [])
      }
    } catch {
      // silently fail — templates are optional
    }
  }

  function handleSelect(template: Template) {
    onChange(template.content)
    setOpen(false)
    toast.success(`Loaded "${template.name}"`)
  }

  async function handleSaveAsTemplate() {
    if (!value.trim()) {
      toast.error('Write some terms first before saving as a template')
      return
    }

    const name = prompt('Template name:')
    if (!name?.trim()) return

    setSaving(true)
    try {
      const res = await fetch('/api/settings/terms-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), content: value, type }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to save template')
        return
      }

      toast.success('Template saved')
      fetchTemplates()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={ref} className="relative inline-flex gap-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        Load Template
        <ChevronDown className="w-3 h-3" />
      </button>

      <button
        type="button"
        onClick={handleSaveAsTemplate}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <Save className="w-3.5 h-3.5" />
        Save as Template
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-20 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {templates.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-500">No templates yet</p>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium">{t.name}</span>
                <span className="block text-xs text-gray-400 truncate mt-0.5">{t.content.slice(0, 60)}...</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
