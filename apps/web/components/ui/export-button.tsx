'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface ExportButtonProps {
  entity: string
  label?: string
}

export function ExportButton({ entity, label = 'Export CSV' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [canExport, setCanExport] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/settings/export-permissions')
      .then(r => r.json())
      .then(data => setCanExport(data.user_can_export ?? false))
      .catch(() => setCanExport(false))
  }, [])

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/export?entity=${entity}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? `${entity}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  // Hide button until permission is confirmed, or if no permission
  if (canExport !== true) return null

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {label}
    </button>
  )
}
