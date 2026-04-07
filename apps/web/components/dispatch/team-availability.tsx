'use client'

import { useState, useEffect } from 'react'
import { Loader2, Users, ChevronLeft, ChevronRight } from 'lucide-react'

interface TeamMember {
  id: string
  first_name: string
  last_name: string
  role: string
  title: string | null
  total_jobs: number
  schedule: Record<string, JobSlot[]>
}

interface JobSlot {
  id: string
  title: string
  status: string
  start: string
  end: string | null
  customer: string | null
}

interface Props {
  onSelectSlot: (memberId: string, date: string) => void
  selectedMemberId?: string
  selectedDate?: string
}

export function TeamAvailability({ onSelectSlot, selectedMemberId, selectedDate }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [daysRange, setDaysRange] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/team/availability?days=7`)
      .then(r => r.json())
      .then(d => {
        setMembers(d.data ?? [])
        setDaysRange(d.days_range ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [weekOffset])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!members.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No team members to show</p>
      </div>
    )
  }

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const isToday = dateStr === today.toISOString().split('T')[0]
    const isTomorrow = dateStr === tomorrow.toISOString().split('T')[0]

    if (isToday) return { day: 'Today', date: d.getDate().toString(), weekday: 'Today' }
    if (isTomorrow) return { day: 'Tmrw', date: d.getDate().toString(), weekday: 'Tomorrow' }

    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate().toString(),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    }
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          Team Availability
        </h2>
        <p className="text-xs text-gray-400">Click a slot to assign</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2 w-36 sticky left-0 bg-white z-10">
                Team Member
              </th>
              {daysRange.map(day => {
                const { weekday, date } = formatDay(day)
                const isSelected = day === selectedDate
                return (
                  <th
                    key={day}
                    className={`text-center text-xs font-medium px-2 py-2 min-w-[80px] ${
                      isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-500'
                    }`}
                  >
                    <div>{weekday}</div>
                    <div className="text-lg font-bold text-gray-900">{date}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map(member => (
              <tr key={member.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-2.5 sticky left-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                      selectedMemberId === member.id ? 'bg-blue-600' : 'bg-gray-400'
                    }`}>
                      {member.first_name[0]}{member.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-[10px] text-gray-400 capitalize truncate">
                        {member.title ?? member.role.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </td>
                {daysRange.map(day => {
                  const jobs = member.schedule[day] ?? []
                  const isSelected = selectedMemberId === member.id && selectedDate === day
                  const jobCount = jobs.length

                  return (
                    <td key={day} className="px-1 py-1.5 text-center">
                      <button
                        onClick={() => onSelectSlot(member.id, day)}
                        className={`w-full min-h-[48px] rounded-lg border transition-all text-left px-2 py-1.5 ${
                          isSelected
                            ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-200'
                            : jobCount === 0
                            ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300'
                            : jobCount <= 2
                            ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                            : 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300'
                        }`}
                      >
                        {jobCount === 0 ? (
                          <span className="text-[10px] text-green-600 font-medium">Open</span>
                        ) : (
                          <div className="space-y-0.5">
                            {jobs.slice(0, 2).map(job => (
                              <div key={job.id} className="text-[10px] leading-tight truncate">
                                <span className="font-medium text-gray-700">{formatTime(job.start)}</span>
                                <span className="text-gray-400 ml-0.5">{job.title.length > 12 ? job.title.slice(0, 12) + '...' : job.title}</span>
                              </div>
                            ))}
                            {jobCount > 2 && (
                              <div className="text-[10px] text-gray-400">+{jobCount - 2} more</div>
                            )}
                          </div>
                        )}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-200" /> Open
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> 1-2 jobs
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> 3+ jobs
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-400" /> Selected
        </div>
      </div>
    </div>
  )
}
