'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Wraps children in a horizontal scroll container with a visible
 * scroll position bar underneath. Works on iOS/mobile where native
 * scrollbars are hidden.
 */
export function ScrollArea({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showBar, setShowBar] = useState(false)
  const [thumbLeft, setThumbLeft] = useState(0)
  const [thumbWidth, setThumbWidth] = useState(0)

  const update = () => {
    const el = scrollRef.current
    if (!el) return
    const canScroll = el.scrollWidth > el.clientWidth + 2
    setShowBar(canScroll)
    if (canScroll) {
      const ratio = el.clientWidth / el.scrollWidth
      setThumbWidth(Math.max(ratio * 100, 15))
      setThumbLeft((el.scrollLeft / (el.scrollWidth - el.clientWidth)) * (100 - ratio * 100))
    }
  }

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
  }, [])

  return (
    <div>
      <div ref={scrollRef} className={`overflow-x-auto ${className}`}>
        {children}
      </div>
      {showBar && (
        <div className="mt-1.5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-1 relative">
          <div
            className="absolute top-0 h-1 bg-gray-400 dark:bg-gray-500 rounded-full transition-all duration-100"
            style={{ left: `${thumbLeft}%`, width: `${thumbWidth}%` }}
          />
        </div>
      )}
    </div>
  )
}
