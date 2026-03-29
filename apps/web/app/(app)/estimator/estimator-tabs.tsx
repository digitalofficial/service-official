'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Send, Loader2, Upload, Cpu, MessageSquare, FileText, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import { AlfredAvatar } from '@/components/alfred/alfred-avatar'
import { formatDate } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface EstimatorTabsProps {
  takeoffs: any[]
  blueprints: any[]
  userName: string
  orgIndustry: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  exported: 'bg-purple-100 text-purple-700',
}

export function EstimatorTabs({ takeoffs, blueprints, userName, orgIndustry }: EstimatorTabsProps) {
  const [tab, setTab] = useState<'chat' | 'blueprints' | 'history'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pathname = usePathname()

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])
  useEffect(() => { if (tab === 'chat') inputRef.current?.focus() }, [tab])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/alfred/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            // Inject estimator context as first system-like message
            { role: 'user', content: `I'm on the Estimator page. I need help with material takeoffs and cost estimates. My industry is ${orgIndustry}.` },
            { role: 'assistant', content: `Hi ${userName}! I'm ready to help with your estimate. Tell me about the project — what type of work, measurements, and materials you need, and I'll calculate everything for you.` },
            ...newMessages.slice(-20),
          ],
          currentPage: pathname,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')

      const assistantContent = data.content ?? ''
      setMessages([...newMessages, { role: 'assistant', content: assistantContent }])
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const TABS = [
    { id: 'chat' as const, label: 'Ask Alfred', icon: MessageSquare },
    { id: 'blueprints' as const, label: 'Blueprints', icon: Upload },
    { id: 'history' as const, label: 'Takeoff History', icon: Clock },
  ]

  const quickPrompts: Record<string, string[]> = {
    roofing: [
      'Estimate shingles for a 2,400 sq ft roof, 6/12 pitch',
      'Materials for a flat TPO roof, 3,000 sq ft',
      'Metal roofing estimate for 1,800 sq ft',
    ],
    painting: [
      'Paint estimate for 4-bedroom interior',
      'Exterior paint for 2,500 sq ft house',
      'Cabinet painting for 30 doors',
    ],
    electrical: [
      'Rough-in for a 2,000 sq ft home',
      '200A panel upgrade materials',
      'Materials for 20 recessed lights',
    ],
    plumbing: [
      'Rough-in for 2 bathrooms + kitchen',
      'Water heater replacement materials',
      'Re-pipe a 3-bed house with PEX',
    ],
    general_contractor: [
      'Framing materials for 1,500 sq ft addition',
      'Drywall estimate for a 2,000 sq ft house',
      'Concrete for a 20x30 slab, 4 inches',
    ],
    hvac: [
      'Ductwork for a 2,500 sq ft home',
      '3-ton split system installation materials',
      'Mini-split for a 500 sq ft addition',
    ],
    flooring: [
      'LVP for 1,200 sq ft main floor',
      'Tile materials for 150 sq ft bathroom',
      'Hardwood for 800 sq ft living area',
    ],
    landscaping: [
      'Mulch for 2,000 sq ft bed area',
      'Paver patio 15x20 ft',
      'Sod for 5,000 sq ft lawn',
    ],
  }

  const prompts = quickPrompts[orgIndustry] ?? quickPrompts.general_contractor

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Chat Tab */}
      {tab === 'chat' && (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: 'calc(100dvh - 280px)', minHeight: '400px' }}>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlfredAvatar size={64} />
                <h3 className="text-lg font-semibold text-gray-900 mt-4">Material Estimator</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  Tell Alfred about your project and he'll calculate materials, quantities, waste factors, and costs. Upload blueprints or just describe the job.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-lg">
                  {prompts.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus() }}
                      className="text-xs px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="shrink-0 mt-1">
                    <AlfredAvatar size={28} />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-50 border border-gray-200 text-gray-900 rounded-bl-md'
                  }`}
                >
                  {msg.content || (isLoading && i === messages.length - 1 && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Calculating...</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 shrink-0">
            <div className="flex items-end gap-3 max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your project — e.g. '2,400 sq ft roof, 6/12 pitch, architectural shingles'"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 max-h-32"
                style={{ minHeight: '44px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blueprints Tab */}
      {tab === 'blueprints' && (
        <div>
          {blueprints.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Upload className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-sm font-semibold text-gray-900 mt-4">No blueprints uploaded</h3>
              <p className="text-xs text-gray-500 mt-1">Upload blueprints for AI-powered material extraction</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Upload Blueprint
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blueprints.map((bp: any) => (
                <div key={bp.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all">
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                    {bp.public_url ? (
                      <img src={bp.public_url} alt={bp.name} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{bp.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      {bp.project && <span>{bp.project.name}</span>}
                      {bp.page_count && <span>{bp.page_count} pages</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {bp.uploader && `${bp.uploader.first_name} ${bp.uploader.last_name} · `}
                      {formatDate(bp.created_at, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div>
          {takeoffs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Cpu className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-sm font-semibold text-gray-900 mt-4">No takeoffs yet</h3>
              <p className="text-xs text-gray-500 mt-1">Use the Ask Alfred tab to start your first material estimate</p>
            </div>
          ) : (
            <div className="space-y-3">
              {takeoffs.map((to: any) => (
                <div key={to.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900">{to.name}</h3>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      {to.project && <span>{to.project.name}</span>}
                      {to.trade && <span className="capitalize">{to.trade}</span>}
                      <span>{formatDate(to.created_at, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {to.ai_confidence != null && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Confidence</p>
                        <p className={`text-sm font-bold ${to.ai_confidence >= 80 ? 'text-green-600' : to.ai_confidence >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {to.ai_confidence}%
                        </p>
                      </div>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[to.status] ?? STATUS_COLORS.pending}`}>
                      {to.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
