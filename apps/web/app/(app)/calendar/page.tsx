'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatDate, statusColor } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from 'lucide-react'

type CalendarView = 'month' | 'week' | 'day'

interface CalendarJob {
  id: string
  title: string
  status: string
  priority: string
  scheduled_start: string
  scheduled_end?: string
  customer?: { first_name?: string; last_name?: string; company_name?: string }
  assignee?: { first_name?: string; last_name?: string }
  city?: string
}

export default function CalendarPage() {
  const router = useRouter()
  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [jobs, setJobs] = useState<CalendarJob[]>([])
  const [loading, setLoading] = useState(true)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Format date as YYYY-MM-DD in local timezone (avoids UTC conversion issues)
  const toLocalDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true)
      const params = new URLSearchParams()

      if (view === 'day') {
        params.set('date', toLocalDate(currentDate))
      } else if (view === 'month') {
        params.set('from', toLocalDate(new Date(year, month, 1)))
        params.set('to', toLocalDate(new Date(year, month + 1, 0)))
      } else if (view === 'week') {
        const weekStart = new Date(currentDate)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        params.set('from', toLocalDate(weekStart))
        params.set('to', toLocalDate(weekEnd))
      }

      const res = await fetch(`/api/jobs?${params.toString()}`)
      const { data } = await res.json()
      setJobs(data ?? [])
      setLoading(false)
    }
    fetchJobs()
  }, [currentDate, view, year, month])

  const navigate = (direction: -1 | 1) => {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() + direction)
    else if (view === 'week') d.setDate(d.getDate() + 7 * direction)
    else d.setDate(d.getDate() + direction)
    setCurrentDate(d)
  }

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay()
    const days: Date[] = []

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i))
    }
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    // Next month padding
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i))
    }
    return days
  }, [year, month])

  const getJobsForDate = (date: Date) => {
    const dateStr = toLocalDate(date)
    return jobs.filter((j) => j.scheduled_start?.startsWith(dateStr))
  }

  const today = toLocalDate(new Date())

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    normal: 'bg-blue-500',
    low: 'bg-gray-400',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => router.push('/jobs/new')}>
          <Plus className="w-4 h-4 mr-2" />New Job
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              ...(view === 'day' ? { weekday: 'long', day: 'numeric' } : {}),
            })}
          </h2>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="text-sm text-blue-600 font-medium hover:underline"
        >
          Today
        </button>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="px-2 py-2 text-xs font-medium text-gray-500 text-center">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, i) => {
              const dateStr = toLocalDate(date)
              const isCurrentMonth = date.getMonth() === month
              const isToday = dateStr === today
              const dayJobs = getJobsForDate(date)

              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r border-gray-100 p-1.5 ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {date.getDate()}
                  </div>

                  <div className="space-y-0.5">
                    {dayJobs.slice(0, 3).map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/jobs/${job.id}`)}
                        className="w-full text-left px-1.5 py-0.5 rounded text-xs truncate hover:bg-gray-100 transition-colors flex items-center gap-1"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_COLORS[job.priority] ?? 'bg-gray-400'}`} />
                        <span className="truncate text-gray-700">{job.title}</span>
                      </button>
                    ))}
                    {dayJobs.length > 3 && (
                      <p className="text-xs text-gray-400 px-1.5">+{dayJobs.length - 3} more</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No jobs scheduled for this day</div>
          ) : (
            <div className="space-y-3">
              {jobs
                .filter((j) => j.scheduled_start?.startsWith(toLocalDate(currentDate)))
                .map((job) => {
                  const colors = statusColor(job.status)
                  return (
                    <button
                      key={job.id}
                      onClick={() => router.push(`/jobs/${job.id}`)}
                      className="w-full text-left bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-all flex items-center gap-4"
                    >
                      <div className={`w-1 h-12 rounded-full ${PRIORITY_COLORS[job.priority] ?? 'bg-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900">{job.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {job.scheduled_start && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(job.scheduled_start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          )}
                          {job.customer && (
                            <span>{job.customer.company_name ?? `${job.customer.first_name} ${job.customer.last_name}`}</span>
                          )}
                          {job.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{job.city}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(currentDate)
              d.setDate(d.getDate() - d.getDay() + i)
              const dateStr = toLocalDate(d)
              const dayJobs = getJobsForDate(d)
              const isToday = dateStr === today

              return (
                <div key={i} className="min-h-[200px]">
                  <div className={`text-center mb-2 pb-2 border-b border-gray-100 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    <p className="text-xs font-medium">{d.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className={`text-lg font-bold ${isToday ? '' : 'text-gray-900'}`}>{d.getDate()}</p>
                  </div>
                  <div className="space-y-1.5">
                    {dayJobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => router.push(`/jobs/${job.id}`)}
                        className="w-full text-left p-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[job.priority] ?? 'bg-gray-400'}`} />
                          <p className="text-xs font-medium text-gray-800 truncate">{job.title}</p>
                        </div>
                        {job.scheduled_start && (
                          <p className="text-xs text-gray-500">
                            {new Date(job.scheduled_start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
