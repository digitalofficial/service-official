'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Client component that wraps server-rendered children with a
 * visible horizontal scroll position bar. Drop this around any
 * content that scrolls horizontally.
 */
export function HorizontalScroll({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showBar, setShowBar] = useState(false)
  const [thumbLeft, setThumbLeft] = useState(0)
  const [thumbWidth, setThumbWidth] = useState(0)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const canScroll = el.scrollWidth > el.clientWidth + 2
    setShowBar(canScroll)
    if (canScroll) {
      const ratio = el.clientWidth / el.scrollWidth
      setThumbWidth(Math.max(ratio * 100, 20))
      const maxScroll = el.scrollWidth - el.clientWidth
      setThumbLeft(maxScroll > 0 ? (el.scrollLeft / maxScroll) * (100 - ratio * 100) : 0)
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [update])

  return (
    <div className={className}>
      <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
        {children}
      </div>
      {showBar && (
        <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full relative">
          <div
            className="absolute top-0 h-1 bg-gray-400 dark:bg-gray-500 rounded-full transition-[left] duration-75"
            style={{ left: `${thumbLeft}%`, width: `${thumbWidth}%` }}
          />
        </div>
      )}
    </div>
  )
}
