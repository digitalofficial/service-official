'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [adminSecret, setAdminSecret] = useState('')
  const [cronSecret, setCronSecret] = useState('')

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configuration for the Service Official platform</p>
      </div>

      {/* Environment Overview */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="font-semibold text-white mb-4">Environment</h2>
        <div className="space-y-3">
          <EnvRow label="Supabase" value={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Connected' : 'Not set'} ok={!!process.env.NEXT_PUBLIC_SUPABASE_URL} />
          <EnvRow label="App URL" value={process.env.NEXT_PUBLIC_APP_URL ?? 'Not set'} ok={!!process.env.NEXT_PUBLIC_APP_URL} />
          <EnvRow label="Admin Secret" value={process.env.NEXT_PUBLIC_ADMIN_SECRET ? 'Set' : 'Not set'} ok={!!process.env.NEXT_PUBLIC_ADMIN_SECRET} />
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="font-semibold text-white mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Vercel Dashboard', href: 'https://vercel.com/digitalofficials-projects/service-official' },
            { label: 'Vercel Domains', href: 'https://vercel.com/digitalofficials-projects/service-official/settings/domains' },
            { label: 'Vercel Env Vars', href: 'https://vercel.com/digitalofficials-projects/service-official/settings/environment-variables' },
            { label: 'Supabase Dashboard', href: 'https://supabase.com/dashboard/project/quonrljpcqjkekedncla' },
            { label: 'Supabase Auth', href: 'https://supabase.com/dashboard/project/quonrljpcqjkekedncla/auth/users' },
            { label: 'Supabase SQL', href: 'https://supabase.com/dashboard/project/quonrljpcqjkekedncla/sql/new' },
            { label: 'GitHub Repo', href: 'https://github.com/digitalofficial/service-official' },
            { label: 'Cloudflare', href: 'https://dash.cloudflare.com' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
            >
              {link.label}
              <span className="text-gray-600 ml-auto">→</span>
            </a>
          ))}
        </div>
      </div>

      {/* New Client Checklist */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="font-semibold text-white mb-4">New Client Setup Checklist</h2>
        <ol className="space-y-3">
          {[
            'Create client at /admin/clients/new',
            'Add CNAME record in their Cloudflare (service → cname.vercel-dns.com, proxy OFF)',
            'Verify domain appears in Vercel Domains (auto-added or add manually)',
            'Add redirect URL in Supabase Auth (https://service.domain.com/**)',
            'Send owner their login URL + temp password',
            'Owner logs in and sets up Twilio in Settings > SMS & Reminders',
            'Owner invites their team in Settings > Team',
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-300">
              <span className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Cron Status */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="font-semibold text-white mb-4">Cron Jobs</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <div>
              <p className="text-sm text-white">Send SMS Reminders</p>
              <p className="text-xs text-gray-500">/api/cron/send-reminders</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Daily at 6:00 AM UTC</p>
              <p className="text-xs text-amber-400">Upgrade to Pro for every 15 min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EnvRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-mono ${ok ? 'text-green-400' : 'text-red-400'}`}>{value}</span>
    </div>
  )
}
