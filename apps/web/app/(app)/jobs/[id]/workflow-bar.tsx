'use client'

import { Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Props {
  status: string
  scheduledStart: string | null
  actualStart: string | null
  actualEnd: string | null
  createdAt: string
}

const STEPS = [
  { key: 'scheduled', label: 'SCHEDULED' },
  { key: 'en_route', label: 'ON THE WAY' },
  { key: 'on_site', label: 'ON SITE' },
  { key: 'in_progress', label: 'IN PROGRESS' },
  { key: 'completed', label: 'COMPLETED' },
] as const

const STATUS_ORDER: Record<string, number> = {
  unscheduled: -1,
  scheduled: 0,
  en_route: 1,
  on_site: 2,
  in_progress: 3,
  completed: 4,
}

export function WorkflowBar({ status, scheduledStart, actualStart, actualEnd, createdAt }: Props) {
  const currentIndex = STATUS_ORDER[status] ?? -1

  const getTimestamp = (stepKey: string): string | null => {
    switch (stepKey) {
      case 'scheduled':
        return scheduledStart ?? createdAt
      case 'en_route':
        return null // no dedicated field
      case 'on_site':
        return null // no dedicated field
      case 'in_progress':
        return actualStart
      case 'completed':
        return actualEnd
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-start justify-between relative">
        {/* Connecting line background */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200" />
        {/* Connecting line filled */}
        {currentIndex >= 0 && (
          <div
            className="absolute top-5 left-5 h-0.5 bg-blue-600 transition-all duration-500"
            style={{
              width: currentIndex >= STEPS.length - 1
                ? 'calc(100% - 40px)'
                : `calc(${(currentIndex / (STEPS.length - 1)) * 100}% - ${currentIndex === 0 ? 0 : 0}px)`,
            }}
          />
        )}

        {STEPS.map((step, i) => {
          const stepIndex = i
          const isCompleted = currentIndex > stepIndex
          const isCurrent = currentIndex === stepIndex
          const isFuture = currentIndex < stepIndex
          const timestamp = (isCompleted || isCurrent) ? getTimestamp(step.key) : null

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
              {/* Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  transition-all duration-300
                  ${isCompleted ? 'bg-blue-600 text-white' : ''}
                  ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200 animate-pulse' : ''}
                  ${isFuture ? 'bg-gray-200 text-gray-400' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-xs">{i + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  mt-2 text-xs font-semibold text-center leading-tight
                  ${isCompleted || isCurrent ? 'text-blue-700' : 'text-gray-400'}
                `}
              >
                {step.label}
              </span>

              {/* Timestamp */}
              {timestamp && (
                <span className="mt-0.5 text-[10px] text-gray-400 text-center">
                  {formatDate(timestamp, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="sm:hidden overflow-x-auto">
        <div className="flex items-start gap-3 min-w-[500px] px-1">
          {STEPS.map((step, i) => {
            const stepIndex = i
            const isCompleted = currentIndex > stepIndex
            const isCurrent = currentIndex === stepIndex
            const isFuture = currentIndex < stepIndex
            const timestamp = (isCompleted || isCurrent) ? getTimestamp(step.key) : null

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${isCompleted ? 'bg-blue-600 text-white' : ''}
                      ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-200 animate-pulse' : ''}
                      ${isFuture ? 'bg-gray-200 text-gray-400' : ''}
                    `}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <span>{i + 1}</span>}
                  </div>
                  <span
                    className={`
                      mt-1 text-[10px] font-semibold text-center leading-tight whitespace-nowrap
                      ${isCompleted || isCurrent ? 'text-blue-700' : 'text-gray-400'}
                    `}
                  >
                    {step.label}
                  </span>
                  {timestamp && (
                    <span className="mt-0.5 text-[9px] text-gray-400 text-center whitespace-nowrap">
                      {formatDate(timestamp, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 mt-[-20px] ${
                      isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
