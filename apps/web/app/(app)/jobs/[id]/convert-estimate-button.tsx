'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ConvertEstimateButton({ estimateId }: { estimateId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleConvert = async () => {
    setLoading(true)
    const res = await fetch(`/api/estimates/${estimateId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to convert estimate')
      setLoading(false)
      return
    }

    toast.success('Estimate converted to invoice')
    router.refresh()
  }

  return (
    <Button size="sm" variant="outline" onClick={handleConvert} disabled={loading}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Convert to Invoice'}
    </Button>
  )
}
