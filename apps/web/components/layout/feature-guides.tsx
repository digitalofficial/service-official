'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react'

// Tour content for each section of the app
const FEATURE_TOURS: Record<string, { title: string; steps: { title: string; description: string }[] }> = {
  dashboard: {
    title: 'Dashboard',
    steps: [
      { title: 'Your Command Center', description: 'The Dashboard shows everything at a glance — pending estimates, active projects, today\'s jobs, outstanding invoices, and your team schedule.' },
      { title: 'Quick Actions', description: 'Use the buttons in the top-right and bottom panel to quickly Dispatch a Job, Create an Invoice, Add a Customer, or start a New Estimate.' },
      { title: 'Jobs Map', description: 'The map shows all your active jobs with pins. Your company\'s home base is marked with a special pin.' },
      { title: 'Overdue Alerts', description: 'If you have overdue invoices, a red banner appears at the top with the total outstanding amount. Click to view them.' },
    ],
  },
  dispatch: {
    title: 'Dispatch',
    steps: [
      { title: 'Creating a Job', description: 'Select an existing customer or create a new one inline. Fill in the job title, priority, address, and schedule.' },
      { title: 'Team Availability', description: 'The availability widget shows which team members are free on your selected date. Click a time slot to auto-assign that person.' },
      { title: 'Customer Notifications', description: 'Customers automatically get an email confirmation. Check the SMS box to also send a text. They\'ll get notified of status changes too.' },
      { title: 'After Dispatch', description: 'The job immediately appears on the Calendar, Jobs list, Dashboard, and in the assigned employee\'s mobile app.' },
    ],
  },
  calendar: {
    title: 'Calendar',
    steps: [
      { title: 'Calendar Views', description: 'Switch between Month, Week, and Day views using the buttons at the top. Navigate with the arrow buttons or click "Today" to jump to the current date.' },
      { title: 'Color-Coded Jobs', description: 'Jobs are color-coded by priority: Red = Urgent, Orange = High, Blue = Normal, Gray = Low. In month view, click a day to see all jobs.' },
      { title: 'Day View Details', description: 'Day view shows full job details — title, time, customer, status, and assignee. Click a job to open its detail page.' },
    ],
  },
  customers: {
    title: 'Customers',
    steps: [
      { title: 'Customer Types', description: 'Filter by type: Residential, Commercial, Property Manager, HOA, or Government. Commercial and Property Manager types support multiple addresses.' },
      { title: 'Customer Detail', description: 'Click a customer to see their full profile — contact info, all jobs, estimates, projects, invoices, and activity history.' },
      { title: 'Multi-Address Support', description: 'For commercial customers, you can manage multiple addresses (Main office, Warehouse, etc.) from the Edit page. Set a primary address for default use.' },
    ],
  },
  leads: {
    title: 'Leads',
    steps: [
      { title: 'Kanban Pipeline', description: 'Your sales pipeline with 5 columns: New, Contacted, Qualified, Proposal, Negotiating. Each column shows the card count and total pipeline value.' },
      { title: 'Lead Cards', description: 'Each card shows the lead title, customer, estimated value, follow-up date, and assignee. Tags help you categorize leads.' },
      { title: 'Converting Leads', description: 'When a lead is won, convert it to a customer and create a project or job from it. Lost leads are moved out of the pipeline.' },
    ],
  },
  estimates: {
    title: 'Estimates',
    steps: [
      { title: 'Creating Estimates', description: 'Click "New Estimate" to build a priced proposal. Add a title, select a customer, and build your line items with quantities, unit costs, and optional markup.' },
      { title: 'Line Items & Tax', description: 'Each line item can be marked as taxable, optional, or have a markup %. The totals section shows subtotal, discount (% or $), tax, and final total.' },
      { title: 'Sending & Tracking', description: 'Save as Draft, then Send to email the customer a public link. Track view count — you\'ll know when they\'ve looked at it.' },
      { title: 'Customer Approval', description: 'Customers can approve or decline directly from the public link. Approved estimates can be converted to invoices or imported as project budget categories.' },
    ],
  },
  invoices: {
    title: 'Invoices',
    steps: [
      { title: 'Invoice Workflow', description: 'Create invoices with line items, tax, and terms. Status flow: Draft → Sent → Partial → Paid. Overdue invoices are flagged automatically.' },
      { title: 'Sending & Payment', description: 'Sent invoices give the customer a public payment link. They can pay online via the payment page. Payments are tracked automatically.' },
      { title: 'From Estimates', description: 'You can create an invoice directly from an approved estimate — all line items carry over.' },
    ],
  },
  projects: {
    title: 'Projects',
    steps: [
      { title: 'Project Hub', description: 'Projects are your largest units of work. Each project has 17 tabs covering everything from scheduling to budgeting to documentation.' },
      { title: 'Overview Tab', description: 'Your project dashboard — see financial stats, progress bar, phases, schedule tasks, milestones, and an items tracker showing open items across all tabs.' },
      { title: 'Timeline → Schedule Connection', description: 'Define phases in Timeline (high-level). Use "Sync from Phases" in Schedule to create Gantt tasks. When you update task progress, the linked phase status updates automatically.' },
      { title: 'Budget & Expenses', description: 'Budget tab tracks budgeted vs actual by category. Expenses tab is where you log costs (pending → approved). Approved expenses feed into the budget and overview stats.' },
      { title: 'Materials & Procurement', description: 'Materials tab tracks what you need (Pending → Ordered → Received → Installed). Costs flow into the budget. Use Purchase Orders for vendor ordering.' },
      { title: 'Documentation', description: 'RFIs (questions), Change Orders (scope changes), Submittals (product approvals), Daily Logs, Punch List — all tracked with status workflows and counts visible on Overview.' },
    ],
  },
  jobs: {
    title: 'Jobs',
    steps: [
      { title: 'Job List & Map', description: 'View all jobs in a list or on the map. Filter by status: Unscheduled, Scheduled, In Progress, Completed, Needs Follow Up.' },
      { title: 'Job Detail', description: 'Each job shows customer info, address (with Maps link), schedule, instructions, assigned employee, and status history.' },
      { title: 'Mobile Workflow', description: 'Field employees use the mobile app to update status: On My Way → Arrived → Start Work → Complete. Customers get SMS notifications at each step.' },
    ],
  },
  equipment: {
    title: 'Equipment',
    steps: [
      { title: 'Equipment Tracking', description: 'Track all company equipment with status (Available, Assigned, Maintenance, Repair, Retired), condition, serial numbers, and daily rates.' },
      { title: 'Assignments', description: 'Assign equipment to projects or team members with start/end dates and daily rates. Equipment status updates to "Assigned" automatically.' },
      { title: 'Maintenance Logs', description: 'Log preventive and corrective maintenance with costs, vendors, and dates. Track next service dates and meter readings.' },
    ],
  },
  'purchase-orders': {
    title: 'Purchase Orders',
    steps: [
      { title: 'Creating POs', description: 'Select a vendor, add line items with quantities and costs. PO number is auto-generated. Tax and shipping costs are included in the total.' },
      { title: 'Receiving Items', description: 'When materials arrive, use "Receive Items" to record quantities received and condition (Good, Damaged, Wrong Item, Short). PO status updates automatically.' },
      { title: 'Material Sync', description: 'PO line items linked to project materials automatically update the material\'s received quantity and status.' },
    ],
  },
  inspections: {
    title: 'Inspections',
    steps: [
      { title: 'Templates', description: 'Create reusable inspection templates with sections and checklist items. Each item can be checkbox, pass/fail, text, number, photo, or signature type.' },
      { title: 'Running Inspections', description: 'Create an inspection from a template. Go through each item marking pass/fail/NA with notes. The overall result is calculated from individual items.' },
      { title: 'Project Link', description: 'Inspections can be linked to projects and show up in the project\'s Inspections tab with status and results.' },
    ],
  },
  reports: {
    title: 'Reports',
    steps: [
      { title: 'Financial Overview', description: 'See total revenue, profit margin, and expenses over the last 12 months. Revenue and expense trends are charted on a line graph.' },
      { title: 'Client Analytics', description: 'View client breakdown, top 10 customers by revenue, and lead conversion rates from your pipeline.' },
      { title: 'Job Metrics', description: 'Track job completion rates and status breakdown to understand your team\'s throughput.' },
    ],
  },
  messages: {
    title: 'Messages',
    steps: [
      { title: 'Conversations', description: 'See all customer conversations in the left panel. Search by name. Each conversation shows the channel (SMS or Email) and last message date.' },
      { title: 'Sending Messages', description: 'Click a conversation to open the thread. Type your message at the bottom and hit Send. Messages go via SMS or email depending on the conversation channel.' },
    ],
  },
  settings: {
    title: 'Settings',
    steps: [
      { title: 'Company Settings', description: 'Update your company name, address, phone, and industry. Manage your subscription and billing.' },
      { title: 'Team Management', description: 'Invite team members, assign roles (Owner, Admin, PM, Foreman, etc.), and manage permissions. Each role controls what features they can access.' },
      { title: 'Integrations', description: 'Connect Stripe for payments (Settings > Payments), Twilio for SMS (Settings > SMS), and configure the Customer Portal (Settings > Portal).' },
      { title: 'Notifications', description: 'Each user can configure their notification preferences — in-app, email, SMS, and push notifications for different event types.' },
    ],
  },
}

// Context for triggering tours from anywhere
interface FeatureGuideContextType {
  startTour: (feature: string) => void
}

const FeatureGuideContext = createContext<FeatureGuideContextType>({ startTour: () => {} })

export function useFeatureGuide() {
  return useContext(FeatureGuideContext)
}

export function FeatureGuideProvider({ children }: { children: React.ReactNode }) {
  const [activeTour, setActiveTour] = useState<string | null>(null)
  const [step, setStep] = useState(0)

  // Auto-show tour on first visit to a section
  useEffect(() => {
    function handleRouteChange() {
      const path = window.location.pathname
      const section = getFeatureFromPath(path)
      if (section && FEATURE_TOURS[section]) {
        const key = `feature-tour-seen-${section}`
        if (!localStorage.getItem(key)) {
          // Small delay so the page renders first
          setTimeout(() => {
            setActiveTour(section)
            setStep(0)
          }, 500)
        }
      }
    }

    handleRouteChange()
    window.addEventListener('popstate', handleRouteChange)

    // Listen for custom navigation events
    const observer = new MutationObserver(() => {
      handleRouteChange()
    })
    observer.observe(document.querySelector('title') || document.head, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      observer.disconnect()
    }
  }, [])

  function startTour(feature: string) {
    if (FEATURE_TOURS[feature]) {
      setActiveTour(feature)
      setStep(0)
    }
  }

  function handleDismiss() {
    if (activeTour) {
      localStorage.setItem(`feature-tour-seen-${activeTour}`, 'true')
    }
    setActiveTour(null)
    setStep(0)
  }

  function handleNext() {
    const tour = activeTour ? FEATURE_TOURS[activeTour] : null
    if (!tour) return
    if (step < tour.steps.length - 1) {
      setStep(step + 1)
    } else {
      handleDismiss()
    }
  }

  function handlePrev() {
    if (step > 0) setStep(step - 1)
  }

  const tour = activeTour ? FEATURE_TOURS[activeTour] : null

  return (
    <FeatureGuideContext.Provider value={{ startTour }}>
      {children}
      {tour && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={handleDismiss} />
          <div className="relative z-[71] w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Progress */}
            <div className="h-1 bg-gray-100">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${((step + 1) / tour.steps.length) * 100}%` }} />
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-gray-500">{tour.title} — {step + 1}/{tour.steps.length}</span>
                </div>
                <button onClick={handleDismiss} className="p-1 text-gray-400 hover:text-gray-600 -mt-1 -mr-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-2">{tour.steps[step].title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{tour.steps[step].description}</p>
            </div>

            <div className="flex items-center justify-between px-5 pb-5">
              <button onClick={handleDismiss} className="text-xs text-gray-400 hover:text-gray-600">
                Skip
              </button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button onClick={handlePrev} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                    <ChevronLeft className="w-3 h-3" /> Back
                  </button>
                )}
                <button onClick={handleNext} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {step === tour.steps.length - 1 ? 'Got it' : 'Next'}
                  {step < tour.steps.length - 1 && <ChevronRight className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </FeatureGuideContext.Provider>
  )
}

function getFeatureFromPath(path: string): string | null {
  if (path === '/dashboard') return 'dashboard'
  if (path === '/dispatch' || path === '/jobs/new') return 'dispatch'
  if (path === '/calendar') return 'calendar'
  if (path.startsWith('/customers')) return 'customers'
  if (path.startsWith('/leads')) return 'leads'
  if (path.startsWith('/estimates')) return 'estimates'
  if (path.startsWith('/invoices')) return 'invoices'
  if (path.startsWith('/projects')) return 'projects'
  if (path === '/jobs' || path.match(/^\/jobs\/[^/]+$/)) return 'jobs'
  if (path.startsWith('/equipment')) return 'equipment'
  if (path.startsWith('/purchase-orders')) return 'purchase-orders'
  if (path.startsWith('/inspections')) return 'inspections'
  if (path.startsWith('/reports')) return 'reports'
  if (path.startsWith('/messages')) return 'messages'
  if (path.startsWith('/settings')) return 'settings'
  return null
}

// Export tour keys for the help menu
export const FEATURE_TOUR_LIST = Object.entries(FEATURE_TOURS).map(([key, tour]) => ({
  key,
  title: tour.title,
}))
