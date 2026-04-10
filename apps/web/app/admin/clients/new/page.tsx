'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const INDUSTRIES = [
  { value: 'roofing', label: 'Roofing' },
  { value: 'general_contractor', label: 'General Contractor' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'painting', label: 'Painting' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'solar', label: 'Solar' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'other', label: 'Other' },
]

const TIERS = [
  { value: 'solo', label: 'Solo — $29/mo', desc: '1 user, CRM, invoices, booking' },
  { value: 'team', label: 'Team — $79/mo', desc: '5 users, + scheduling, SMS' },
  { value: 'growth', label: 'Growth — $149/mo', desc: '15 users, + reporting, workflows' },
  { value: 'enterprise', label: 'Enterprise — Custom', desc: 'Unlimited users, white-label' },
]

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [form, setForm] = useState({
    company_name: '',
    industry: 'general_contractor',
    owner_email: '',
    owner_first_name: '',
    owner_last_name: '',
    owner_phone: '',
    subscription_tier: 'solo',
  })

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    if (!form.company_name || !form.owner_email) {
      toast.error('Fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '',
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create client')
        return
      }

      setResult(data)
      toast.success(`${form.company_name} created successfully!`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-3xl space-y-6">
        {/* Success Banner */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
          <h2 className="text-lg font-bold text-green-400 mb-4">Client Created Successfully</h2>
          <div className="space-y-3 text-sm">
            <Row label="Company" value={result.client.company_name} />
            <Row label="Login URL" value={result.client.app_url} link />
            <Row label="Login Email" value={result.client.login_email} />
            <Row label="Temp Password" value={result.client.temp_password} copy />
          </div>
        </div>

        {/* Email Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-2">Welcome Email</h3>
          {result.email_sent ? (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-xs">✓</span>
              <span>Login credentials sent to {result.client.login_email}</span>
            </div>
          ) : (
            <div>
              <p className="text-sm text-amber-400 mb-2">Email failed — send credentials manually:</p>
              <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-1 font-mono">
                <p>Login URL: <span className="text-blue-400">{result.client.app_url}</span></p>
                <p>Email: <span className="text-white">{result.client.login_email}</span></p>
                <p>Password: <span className="text-green-400">{result.client.temp_password}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Copy credentials fallback */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-3">Credentials</h3>
          <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-1 font-mono">
            <p>Login URL: <span className="text-blue-400">{result.client.app_url}</span></p>
            <p>Email: <span className="text-white">{result.client.login_email}</span></p>
            <p>Password: <span className="text-green-400">{result.client.temp_password}</span></p>
          </div>
          <button
            onClick={() => {
              const text = `Login URL: ${result.client.app_url}\nEmail: ${result.client.login_email}\nPassword: ${result.client.temp_password}`
              navigator.clipboard.writeText(text)
              toast.success('Credentials copied!')
            }}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            Copy All Credentials
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setResult(null); setForm({ company_name: '', industry: 'general_contractor', owner_email: '', owner_first_name: '', owner_last_name: '', owner_phone: '', subscription_tier: 'solo' }) }}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg"
          >
            Add Another Client
          </button>
          <a href="/admin/clients" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg">
            View All Clients
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Add New Client</h1>
        <p className="text-gray-400 text-sm mt-1">Creates their organization and account with a 14-day free trial</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-white">Company Info</h2>

        <Field label="Company Name *">
          <input
            value={form.company_name}
            onChange={e => update('company_name', e.target.value)}
            placeholder="Smith Roofing LLC"
            className="input"
          />
        </Field>

        <Field label="Industry">
          <select value={form.industry} onChange={e => update('industry', e.target.value)} className="input">
            {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-white">Owner Account</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name *">
            <input value={form.owner_first_name} onChange={e => update('owner_first_name', e.target.value)} placeholder="John" className="input" />
          </Field>
          <Field label="Last Name *">
            <input value={form.owner_last_name} onChange={e => update('owner_last_name', e.target.value)} placeholder="Smith" className="input" />
          </Field>
        </div>

        <Field label="Email *">
          <input value={form.owner_email} onChange={e => update('owner_email', e.target.value)} placeholder="john@smithroofing.com" type="email" className="input" />
        </Field>

        <Field label="Phone">
          <input value={form.owner_phone} onChange={e => update('owner_phone', e.target.value)} placeholder="+1 (555) 000-0000" className="input" />
        </Field>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Subscription Plan</h2>
        <div className="space-y-2">
          {TIERS.map(tier => (
            <label key={tier.value} className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${form.subscription_tier === tier.value ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
              <input type="radio" name="tier" value={tier.value} checked={form.subscription_tier === tier.value} onChange={e => update('subscription_tier', e.target.value)} className="accent-blue-500" />
              <div>
                <p className="text-sm font-medium text-white">{tier.label}</p>
                <p className="text-xs text-gray-400">{tier.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading ? 'Creating client...' : 'Create Client'}
      </button>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

function Row({ label, value, link, copy }: { label: string; value: string; link?: boolean; copy?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-800">
      <span className="text-gray-400">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{value}</a>
      ) : (
        <span className={`font-mono text-sm ${copy ? 'bg-gray-800 px-2 py-1 rounded text-green-400' : 'text-white'}`}>{value}</span>
      )}
    </div>
  )
}
