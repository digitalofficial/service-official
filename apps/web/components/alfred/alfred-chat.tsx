'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { X, Send, Loader2, AlertCircle } from 'lucide-react'
import { AlfredAvatar } from './alfred-avatar'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AlfredChatProps {
  userName: string
}

export function AlfredChat({ userName }: AlfredChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [notified, setNotified] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pathname = usePathname()

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const notifyAdmin = async (lastUserMessage: string) => {
    if (notified) return
    try {
      await fetch('/api/alfred/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: lastUserMessage, currentPage: pathname }),
      })
      setNotified(true)
    } catch {}
  }

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
          messages: newMessages.slice(-20), // Keep last 20 messages for context
          currentPage: pathname,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to get response')

      let assistantContent = data.content ?? ''

      // Check if Alfred wants to notify admin
      if (assistantContent.includes('[NOTIFY_ADMIN]')) {
        assistantContent = assistantContent.replace('[NOTIFY_ADMIN]', '').trim()
        notifyAdmin(text)
      }

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

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[min(500px,calc(100dvh-8rem))] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <AlfredAvatar size={32} />
              <div>
                <p className="text-sm font-semibold leading-none">Alfred</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Service Official Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="mx-auto mb-3">
                  <AlfredAvatar size={48} />
                </div>
                <p className="text-sm font-medium text-gray-900">Hi {userName}, I'm Alfred</p>
                <p className="text-xs text-gray-500 mt-1 max-w-[240px] mx-auto">
                  I can estimate materials, calculate costs, and help you use the platform.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                  {['Estimate materials for a roof', 'How much paint for a room?', 'Help me create a takeoff'].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); inputRef.current?.focus() }}
                      className="text-xs px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="shrink-0 mt-1">
                    <AlfredAvatar size={24} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}
                >
                  {msg.content || (isLoading && i === messages.length - 1 && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ))}
                </div>
              </div>
            ))}

            {notified && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-xs text-green-700">The Service Official team has been notified and will follow up.</p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Alfred anything..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 max-h-24"
                style={{ minHeight: '36px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 transition-all overflow-hidden ${
          isOpen
            ? 'bg-gray-900 hover:bg-gray-800 scale-90'
            : 'bg-[#1E3A5F] hover:scale-105 ring-2 ring-amber-400/50'
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <AlfredAvatar size={56} />
        )}
      </button>
    </>
  )
}
