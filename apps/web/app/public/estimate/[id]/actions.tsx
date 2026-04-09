'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckCircle2, XCircle, Printer, Loader2, Pen } from 'lucide-react'

interface PublicEstimateActionsProps {
  estimateId: string
  estimateStatus: string
  signatureUrl?: string
}

export function PublicEstimateActions({ estimateId, estimateStatus }: PublicEstimateActionsProps) {
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  // Track status client-side so we don't depend on page reload
  const [status, setStatus] = useState(estimateStatus)

  const canRespond = ['sent', 'viewed'].includes(status)

  return (
    <>
      <div className="flex items-center gap-2 no-print flex-wrap justify-end">
        {canRespond && (
          <>
            <button
              onClick={() => setShowApproveModal(true)}
              className="px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Approve Estimate</span>
              <span className="sm:hidden">Approve</span>
            </button>
            <button
              onClick={() => setShowDeclineModal(true)}
              className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </>
        )}
        {status === 'approved' && (
          <div className="px-3 sm:px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Approved
          </div>
        )}
        {status === 'declined' && (
          <div className="px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center gap-1.5">
            <XCircle className="w-4 h-4" />
            Declined
          </div>
        )}
        <button
          onClick={() => window.print()}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">PDF</span>
        </button>
      </div>

      {showApproveModal && (
        <ApproveModal
          estimateId={estimateId}
          onClose={() => setShowApproveModal(false)}
          onApproved={() => {
            setShowApproveModal(false)
            setStatus('approved')
            // Force a fresh page load with cache-busting query param
            setTimeout(() => {
              window.location.href = window.location.pathname + '?v=' + Date.now()
            }, 1200)
          }}
        />
      )}

      {showDeclineModal && (
        <DeclineModal
          estimateId={estimateId}
          onClose={() => setShowDeclineModal(false)}
          onDeclined={() => {
            setShowDeclineModal(false)
            setStatus('declined')
            setTimeout(() => {
              window.location.href = window.location.pathname + '?v=' + Date.now()
            }, 1200)
          }}
        />
      )}
    </>
  )
}

function ApproveModal({ estimateId, onClose, onApproved }: { estimateId: string; onClose: () => void; onApproved: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSignature, setHasSignature] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctxRef.current = ctx
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    function getPos(e: MouseEvent | TouchEvent) {
      const r = canvas!.getBoundingClientRect()
      if ('touches' in e && e.touches.length > 0) {
        return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      }
      return { x: (e as MouseEvent).clientX - r.left, y: (e as MouseEvent).clientY - r.top }
    }

    const startDraw = (e: MouseEvent | TouchEvent) => { e.preventDefault(); isDrawing.current = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
    const draw = (e: MouseEvent | TouchEvent) => { if (!isDrawing.current) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasSignature(true) }
    const endDraw = () => { isDrawing.current = false }

    canvas.addEventListener('mousedown', startDraw)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', endDraw)
    canvas.addEventListener('mouseleave', endDraw)
    canvas.addEventListener('touchstart', startDraw, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', endDraw)

    return () => {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', endDraw)
      canvas.removeEventListener('mouseleave', endDraw)
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', endDraw)
    }
  }, [])

  function clearSignature() {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  async function handleApprove() {
    setLoading(true)
    setError('')

    // Step 1: Try with signature
    try {
      let sig: string | undefined
      if (hasSignature && canvasRef.current) {
        sig = canvasRef.current.toDataURL('image/jpeg', 0.4)
        // If signature data URL is too large, skip it
        if (sig.length > 200000) sig = undefined
      }

      const res = await fetch(`/api/public/estimates/${estimateId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_url: sig }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        onApproved()
        return
      }

      // If failed with signature, retry without
      if (!res.ok && sig) {
        const retry = await fetch(`/api/public/estimates/${estimateId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const retryData = await retry.json()
        if (retry.ok && retryData.success) {
          onApproved()
          return
        }
        setError(retryData.error || `Server error (${retry.status})`)
      } else {
        setError(data.error || `Server error (${res.status})`)
      }
    } catch (err: any) {
      console.error('Approve fetch error:', err)
      // Network error — try one more time without signature
      try {
        const retry = await fetch(`/api/public/estimates/${estimateId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const retryData = await retry.json()
        if (retry.ok && retryData.success) {
          onApproved()
          return
        }
        setError(retryData.error || 'Failed to approve')
      } catch {
        setError('Network error — please check your connection and try again')
      }
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Approve Estimate</h2>
            <p className="text-sm text-gray-500">Sign below to approve</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Pen className="w-3.5 h-3.5" /> Signature (optional)
            </label>
            {hasSignature && (
              <button onClick={clearSignature} className="text-xs text-blue-600 hover:underline">Clear</button>
            )}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
            <canvas ref={canvasRef} className="w-full cursor-crosshair" style={{ height: 120, touchAction: 'none' }} />
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg p-3">
          By clicking &quot;Approve&quot;, you agree to the scope of work and authorize the work to proceed.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleApprove} disabled={loading} className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? 'Approving...' : 'Approve & Sign'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeclineModal({ estimateId, onClose, onDeclined }: { estimateId: string; onClose: () => void; onDeclined: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')

  async function handleDecline() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/public/estimates/${estimateId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || undefined }),
      })
      const data = await res.json()
      if (res.ok && data.success) { onDeclined(); return }
      setError(data.error || 'Failed to decline')
    } catch { setError('Network error') }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Decline Estimate</h2>
            <p className="text-sm text-gray-500">Let us know why (optional)</p>
          </div>
        </div>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for declining..." rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500" />
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleDecline} disabled={loading} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            {loading ? 'Declining...' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  )
}
