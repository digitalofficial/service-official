import { createServerSupabaseClient } from '@service-official/database'
import { formatDate } from '@/lib/utils'
import { Plus, CloudSun, Thermometer, Users, AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Daily Logs' }

const WEATHER_ICONS: Record<string, string> = {
  clear: '☀️', partly_cloudy: '⛅', cloudy: '☁️', rain: '🌧️',
  heavy_rain: '⛈️', snow: '❄️', wind: '💨', storm: '⛈️',
}

export default async function DailyLogsPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: logs } = await supabase
    .from('daily_logs')
    .select('*, submitter:profiles!submitted_by(first_name, last_name, avatar_url)')
    .eq('project_id', params.id)
    .order('log_date', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Daily Logs ({logs?.length ?? 0})</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Log
        </button>
      </div>

      {logs?.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
          <p className="text-sm">No daily logs yet</p>
          <p className="text-xs mt-1">Track weather, crew, and work performed each day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs?.map(log => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(log.log_date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted by {log.submitter?.first_name} {log.submitter?.last_name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {log.weather_delay && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Weather Delay {log.weather_delay_hours}h
                    </span>
                  )}
                </div>
              </div>

              {/* Weather + Crew Row */}
              <div className="flex flex-wrap gap-4 mb-4">
                {log.weather && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-lg">{WEATHER_ICONS[log.weather] ?? '🌤️'}</span>
                    <span className="capitalize">{log.weather.replace('_', ' ')}</span>
                    {(log.temperature_high || log.temperature_low) && (
                      <span className="text-gray-400">
                        {log.temperature_high ? `${log.temperature_high}°` : ''}
                        {log.temperature_low ? ` / ${log.temperature_low}°` : ''}
                      </span>
                    )}
                  </div>
                )}
                {log.crew_count && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    {log.crew_count} crew members
                    {log.crew_hours && <span className="text-gray-400">· {log.crew_hours} hrs</span>}
                  </div>
                )}
              </div>

              {/* Work Performed */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Work Performed</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{log.work_performed}</p>
              </div>

              {/* Areas */}
              {log.areas_worked && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Areas Worked</p>
                  <p className="text-sm text-gray-600">{log.areas_worked}</p>
                </div>
              )}

              {/* Issues */}
              {log.issues && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Issues</p>
                  <p className="text-sm text-amber-800">{log.issues}</p>
                </div>
              )}

              {/* Safety */}
              {log.safety_incidents && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Safety Incidents</p>
                  <p className="text-sm text-red-800">{log.safety_incidents}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
