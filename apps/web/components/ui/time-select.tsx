'use client'

/** Generate time options in 30-minute increments for full 24 hours */
const TIME_OPTIONS: { label: string; value: string }[] = []
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    const hour24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    const ampm = h < 12 ? 'AM' : 'PM'
    const min = m === 0 ? '00' : '30'
    TIME_OPTIONS.push({ label: `${hour12}:${min} ${ampm}`, value: hour24 })
  }
}

interface TimeSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export function TimeSelect({ value, onChange, placeholder = 'Select time...', required, className }: TimeSelectProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      className={`flex h-9 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className ?? ''}`}
    >
      <option value="">{placeholder}</option>
      {TIME_OPTIONS.map(t => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </select>
  )
}

/**
 * Add hours to a time string (HH:MM format).
 * Wraps around midnight for 24-hour support.
 */
export function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number)
  const newH = (h + hours) % 24
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
