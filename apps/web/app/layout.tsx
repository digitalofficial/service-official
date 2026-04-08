import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from 'next-themes'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'Service Official', template: '%s | Service Official' },
  description: 'The Contractor Operating System — CRM, scheduling, estimates, invoices, and AI takeoffs built for contractors.',
  icons: { icon: '/icon.svg' },
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://serviceofficial.com'),
  openGraph: {
    type: 'website',
    siteName: 'Service Official',
    title: 'Service Official',
    description: 'The Contractor Operating System — CRM, scheduling, estimates, invoices, and AI takeoffs built for contractors.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Service Official',
    description: 'The Contractor Operating System',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
