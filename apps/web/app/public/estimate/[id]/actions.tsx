'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Printer, Loader2, Pen } from 'lucide-react'

interface PublicEstimateActionsProps {
  estimateId: string
  estimateStatus: string
  signatureUrl?: string
}

export function PublicEstimateActions({ estimateId, estimateStatus, signatureUrl }: PublicEstimateActionsProps) {
  const router = useRouter()
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const canRespond = ['sent', 'viewed'].includes(estimateStatus)

  return (
    <>
      <div className="flex items-center gap-2 no-print">
        {canRespond && (
          <>
            <button
              onClick={() => setShowApproveModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Estimate
            </button>
            <button
              onClick={() => setShowDeclineModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </>
        )}
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4 inline mr-1.5" />
          PDF
        </button>
      </div>

      {/* Approve Modal with Signature */}
      {showApproveModal && (
        <ApproveModal
          estimateId={estimateId}
          onClose={() => setShowApproveModal(false)}
          onApproved={() => { setShowApproveModal(false); router.refresh() }}
        />
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <DeclineModal
          estimateId={estimateId}
          onClose={() => setShowDeclineModal(false)}
          onDeclined={() => { setShowDeclineModal(false); router.refresh() }}
        />
      )}
    </>
  )
}

function ApproveModal({ estimateId, onClose, onApproved }: { estimateId: string; onClose: () => void; onApproved: () => void }) {
  const [loading, setLoading] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set up canvas
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    function getPos(e: MouseEvent | TouchEvent) {
      const rect = canvas!.getBoundingClientRect()
      if ('touches' in e) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function startDraw(e: MouseEvent | TouchEvent) {
      isDrawing.current = true
      const pos = getPos(e)
      ctx!.beginPath()
      ctx!.moveTo(pos.x, pos.y)
    }

    function draw(e: MouseEvent | TouchEvent) {
      if (!isDrawing.current) return
      e.preventDefault()
      const pos = getPos(e)
      ctx!.lineTo(pos.x, pos.y)
      ctx!.stroke()
      setHasSignature(true)
    }

    function endDraw() {
      isDrawing.current = false
    }

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
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  async function handleApprove() {
    setLoading(true)

    let signatureUrl: string | undefined
    if (hasSignature && canvasRef.current) {
      signatureUrl = canvasRef.current.toDataURL('image/png')
    }

    const res = await fetch(`/api/public/estimates/${estimateId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature_url: signatureUrl }),
    })

    if (res.ok) {
      onApproved()
    } else {
      const err = await res.json()
      alert(err.error || 'Failed to approve')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Approve Estimate</h2>
            <p className="text-sm text-gray-500">Sign below to approve this estimate</p>
          </div>
        </div>

        {/* Signature Pad */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Pen className="w-3.5 h-3.5" /> Your Signature
            </label>
            {hasSignature && (
              <button onClick={clearSignature} className="text-xs text-blue-600 hover:underline">Clear</button>
            )}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ height: 140 }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Draw your signature with your mouse or finger</p>
        </div>

        <p className="text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg p-3">
          By clicking "Approve & Sign", you agree to the terms and scope of work outlined in this estimate and authorize the work to proceed.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
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
  const [reason, setReason] = useState('')

  async function handleDecline() {
    setLoading(true)
    const res = await fetch(`/api/public/estimates/${estimateId}/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || undefined }),
    })
    if (res.ok) {
      onDeclined()
    } else {
      alert('Failed to decline')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Decline Estimate</h2>
            <p className="text-sm text-gray-500">Let us know why (optional)</p>
          </div>
        </div>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason for declining (optional)..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDecline}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            {loading ? 'Declining...' : 'Decline Estimate'}
          </button>
        </div>
      </div>
    </div>
  )
}
