export const colors = {
  background: '#0f172a',
  card: '#1e293b',
  border: '#334155',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
} as const

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 30,
} as const

// Tablet-scaled font sizes
export function scaledFont(size: number, isTablet: boolean) {
  return isTablet ? Math.round(size * 1.15) : size
}
