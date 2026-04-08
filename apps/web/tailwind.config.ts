import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  // Safelist dynamic status colors used in statusColor() utility
  safelist: [
    // Yellow (in_progress)
    'bg-yellow-100', 'text-yellow-800', 'border-yellow-300',
    'bg-yellow-50', 'text-yellow-700', 'border-yellow-200',
    // Sky (en_route, viewed)
    'bg-sky-50', 'text-sky-700', 'border-sky-200',
    'bg-sky-100',
    // Indigo (on_site, invoiced)
    'bg-indigo-50', 'text-indigo-700', 'border-indigo-200',
    'bg-indigo-100',
    // Emerald (paid)
    'bg-emerald-50', 'text-emerald-700', 'border-emerald-200',
    // Amber (partial, outstanding)
    'bg-amber-50', 'text-amber-700', 'border-amber-200',
  ],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a5f',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { from: { transform: 'translateY(-8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
