import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  MapPin,
  BarChart3,
  MessageSquare,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Star,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <Image src="/icon.png" alt="Service Official" width={36} height={36} className="rounded-xl" />
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                Service Official
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full text-sm text-brand-700 font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Built for contractors, by contractors
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
            Run your entire business
            <br />
            <span className="text-brand-600">from one platform</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Projects, jobs, invoices, estimates, dispatch, scheduling, and team management — everything a contractor needs to grow, in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-brand-600/25 transition-all hover:shadow-xl hover:shadow-brand-600/30"
            >
              Start Your 14-Day Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-base font-semibold rounded-xl transition-colors"
            >
              See Features
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400">No credit card required. Cancel anytime.</p>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-6xl mx-auto mt-16 relative">
          <div className="absolute -inset-4 bg-gradient-to-b from-brand-100/40 to-transparent rounded-3xl blur-2xl" />
          <div className="relative bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-gray-700 rounded-md px-4 py-1 text-xs text-gray-400 font-mono">
                  serviceofficial.app/dashboard
                </div>
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">Good morning, Jake</p>
                  <p className="text-sm text-gray-400">Here&apos;s your business at a glance</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Revenue This Month', value: '$47,250', color: 'text-green-400' },
                  { label: 'Active Projects', value: '12', color: 'text-white' },
                  { label: 'Jobs Today', value: '8', color: 'text-blue-400' },
                  { label: 'Outstanding', value: '$12,800', color: 'text-amber-400' },
                ].map((m) => (
                  <div key={m.label} className="bg-gray-800 rounded-xl p-4">
                    <p className={`text-xl sm:text-2xl font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { name: 'Smith Residence Roof', status: 'In Progress', pct: 75 },
                  { name: 'Downtown Office Build', status: 'In Progress', pct: 42 },
                  { name: 'Lakewood Renovation', status: 'Starting', pct: 10 },
                ].map((p) => (
                  <div key={p.name} className="bg-gray-800 rounded-xl p-4">
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{p.status}</p>
                    <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Everything you need to run your operation
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Stop juggling spreadsheets, paper invoices, and text messages. Service Official replaces them all.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: LayoutDashboard,
                title: 'Live Dashboard',
                desc: 'Revenue, active projects, jobs today, and outstanding invoices — all at a glance the moment you log in.',
              },
              {
                icon: FileText,
                title: 'Estimates & Invoices',
                desc: 'Create professional estimates, convert to invoices with one click, and track payments in real-time.',
              },
              {
                icon: MapPin,
                title: 'Dispatch & Routing',
                desc: 'See your crews on a map, assign jobs, and optimize routes so nothing falls through the cracks.',
              },
              {
                icon: Users,
                title: 'Team Management',
                desc: 'Invite your crew with role-based access. Owners, managers, and field workers each see what they need.',
              },
              {
                icon: Calendar,
                title: 'Scheduling',
                desc: 'Drag-and-drop calendar for jobs and milestones. Automatic SMS reminders so customers never forget.',
              },
              {
                icon: BarChart3,
                title: 'Reports & Analytics',
                desc: 'Revenue trends, job profitability, team performance — data-driven decisions without the spreadsheet.',
              },
              {
                icon: MessageSquare,
                title: 'Built-in Messaging',
                desc: 'Internal team chat and customer SMS notifications. Keep all communication in one thread.',
              },
              {
                icon: Zap,
                title: 'Automation',
                desc: 'Auto-send reminders, follow up on unpaid invoices, and trigger workflows when job status changes.',
              },
              {
                icon: Shield,
                title: 'Secure & Isolated',
                desc: 'Your data is completely isolated. Bank-level encryption and row-level security on every query.',
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-50 transition-all group">
                <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                  <f.icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Up and running in minutes
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              No setup calls. No onboarding fees. Just sign up and go.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                step: '01',
                title: 'Create your account',
                desc: 'Sign up with your company info. Your workspace is ready instantly with a 14-day free trial.',
              },
              {
                step: '02',
                title: 'Add your team & data',
                desc: 'Invite crew members, add customers, and create your first project. Import from spreadsheets if you want.',
              },
              {
                step: '03',
                title: 'Run your business',
                desc: 'Dispatch crews, send invoices, track payments, and watch your revenue grow from one dashboard.',
              },
            ].map((s) => (
              <div key={s.step} className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-2xl text-white font-bold text-lg mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Simple, honest pricing
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Start free. Upgrade when you&apos;re ready. No contracts, cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Solo',
                price: '$29',
                desc: 'For independent contractors',
                features: ['1 user', 'CRM & customers', 'Estimates & invoices', 'Project tracking', 'Payment tracking'],
                popular: false,
              },
              {
                name: 'Team',
                price: '$79',
                desc: 'For small crews',
                features: ['Up to 5 users', 'Everything in Solo', 'Job scheduling & dispatch', 'SMS reminders', 'Team management'],
                popular: true,
              },
              {
                name: 'Growth',
                price: '$149',
                desc: 'For growing operations',
                features: ['Up to 15 users', 'Everything in Team', 'Reports & analytics', 'Automation workflows', 'Priority support'],
                popular: false,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                desc: 'For large operations',
                features: ['Unlimited users', 'Everything in Growth', 'Custom domain', 'White-label branding', 'Dedicated support'],
                popular: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 sm:p-8 border ${
                  plan.popular
                    ? 'bg-brand-600 border-brand-600 text-white shadow-xl shadow-brand-600/20 scale-[1.02]'
                    : 'bg-white border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium text-white mb-4">
                    <Star className="w-3 h-3" /> Most Popular
                  </div>
                )}
                <h3 className={`text-lg font-semibold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-3xl sm:text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  {plan.price !== 'Custom' && (
                    <span className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-500'}`}>/mo</span>
                  )}
                </div>
                <p className={`mt-1 text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-500'}`}>
                  {plan.desc}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.popular ? 'text-blue-200' : 'text-brand-600'}`} />
                      <span className={plan.popular ? 'text-blue-50' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className={`mt-8 block text-center py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                    plan.popular
                      ? 'bg-white text-brand-600 hover:bg-blue-50'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {plan.price === 'Custom' ? 'Contact Us' : 'Start Free Trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Ready to take control of your business?
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Join contractors who are managing their projects, crews, and revenue with Service Official.
          </p>
          <div className="mt-10">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-brand-600/25 transition-all hover:shadow-xl hover:shadow-brand-600/30"
            >
              Start Your Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="Service Official" width={28} height={28} className="rounded-lg" />
            <span className="text-sm font-semibold text-gray-900">Service Official</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Service Official. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-700">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-700">Terms of Service</Link>
            <Link href="/auth/login" className="text-xs text-gray-500 hover:text-gray-700">Sign in</Link>
            <Link href="/auth/register" className="text-xs text-gray-500 hover:text-gray-700">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
