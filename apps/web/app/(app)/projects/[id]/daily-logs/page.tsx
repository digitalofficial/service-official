import { getProfile } from '@/lib/auth/get-profile'
import { AddItemForm } from '@/components/projects/add-item-form'
import { formatDate } from '@/lib/utils'
import { Users, AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Daily Logs' }

const WEATHER_ICONS: Record<string, string> = {
  clear: '☀️', partly_cloudy: '⛅', cloudy: '☁️', rain: '🌧️',
  heavy_rain: '⛈️', snow: '❄️', wind: '💨', storm: '⛈️',
}

const FIELDS = [
  { name: 'log_date', label: 'Date', type: 'date' as const, required: true, defaultValue: new Date().toISOString().split('T')[0] },
  { name: 'weather', label: 'Weather', type: 'select' as const, options: [
    { label: 'Clear', value: 'clear' }, { label: 'Partly Cloudy', value: 'partly_cloudy' },
    { label: 'Cloudy', value: 'cloudy' }, { label: 'Rain', value: 'rain' },
    { label: 'Heavy Rain', value: 'heavy_rain' }, { label: 'Wind', value: 'wind' },
    { label: 'Storm', value: 'storm' },
  ], defaultValue: 'clear' },
  { name: 'temperature_high', label: 'High Temp (°F)', type: 'number' as const, placeholder: '95' },
  { name: 'temperature_low', label: 'Low Temp (°F)', type: 'number' as const, placeholder: '72' },
  { name: 'crew_count', label: 'Crew Count', type: 'number' as const, placeholder: '4' },
  { name: 'crew_hours', label: 'Total Crew Hours', type: 'number' as const, placeholder: '32', step: '0.5' },
  { name: 'work_performed', label: 'Work Performed', type: 'textarea' as const, placeholder: 'Describe work completed today...', required: true, colSpan: 2 },
  { name: 'areas_worked', label: 'Areas Worked', type: 'text' as const, placeholder: 'e.g. South slope, garage', colSpan: 2 },
  { name: 'issues', label: 'Issues / Notes', type: 'textarea' as const, placeholder: 'Any issues or delays...', colSpan: 2 },
]

export default async function DailyLogsPage({ params }: { params: { id: string } }) {
  const { supabase } = await getProfile()
  const { data: logs } = await supabase
    .from('daily_logs')
    .select('*, submitter:profiles!submitted_by(first_name, last_name)')
    .eq('project_id', params.id)
    .order('log_date', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Daily Logs ({logs?.length ?? 0})</h3>
        <AddItemForm projectId={params.id} itemType="daily_log" buttonLabel="New Log" formTitle="Daily Log" fields={FIELDS} />
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatDate(log.log_date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted by {log.submitter?.first_name} {log.submitter?.last_name}
                  </p>
                </div>
                {log.weather_delay && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Weather Delay {log.weather_delay_hours}h
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mb-4">
                {log.weather && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-lg">{WEATHER_ICONS[log.weather] ?? '🌤️'}</span>
                    <span className="capitalize">{log.weather.replace('_', ' ')}</span>
                    {(log.temperature_high || log.temperature_low) && (
                      <span className="text-gray-400">{log.temperature_high}° / {log.temperature_low}°</span>
                    )}
                  </div>
                )}
                {log.crew_count && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    {log.crew_count} crew{log.crew_hours && <span className="text-gray-400">· {log.crew_hours} hrs</span>}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Work Performed</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{log.work_performed}</p>
              </div>
              {log.areas_worked && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Areas Worked</p>
                  <p className="text-sm text-gray-600">{log.areas_worked}</p>
                </div>
              )}
              {log.issues && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Issues</p>
                  <p className="text-sm text-amber-800">{log.issues}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
