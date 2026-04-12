'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

const TOUR_STEPS = [
  {
    title: 'Welcome to Your Project',
    description: 'This is your project command center. Each tab tracks a different aspect of your project. Let\'s walk through how they\'re all connected.',
    tab: 'Overview',
  },
  {
    title: 'Overview',
    description: 'Your project dashboard. See financial stats (expenses, materials, labor, change orders), project progress computed from your schedule tasks, phases with status controls, milestones, and a tracker for all open items across every tab.',
    tab: 'Overview',
  },
  {
    title: 'Timeline',
    description: 'Define your project phases (e.g. Demolition, Framing, Roofing) and milestones (e.g. Inspection passed). Change phase status with the dropdown. Mark milestones complete. These feed into your Overview progress.',
    tab: 'Timeline',
  },
  {
    title: 'Schedule',
    description: 'Your Gantt chart. Use "Sync from Phases" to pull in your timeline phases as tasks. Edit task progress (0-100%) — when a task linked to a phase is updated, the phase status updates automatically. Add dependencies between tasks.',
    tab: 'Schedule',
  },
  {
    title: 'Budget',
    description: 'Track budgeted vs actual costs by category. Add categories manually or import from an approved estimate. Actuals are computed from your expenses, materials, and labor hours.',
    tab: 'Budget',
  },
  {
    title: 'Expenses',
    description: 'Log project expenses with category, vendor, and amount. New expenses start as "Pending" — owners and admins can approve or reject them using the action buttons. Approved expenses show in Overview and Budget.',
    tab: 'Expenses',
  },
  {
    title: 'Materials',
    description: 'Track materials needed for the project. Add with quantity and unit cost — total cost is computed automatically. Change status as materials move through: Pending → Ordered → Received → Installed.',
    tab: 'Materials',
  },
  {
    title: 'Punch List',
    description: 'Track items that need fixing before final walkthrough. Each item has a status: Open → In Progress → Completed. Open punch items show in your Overview tracker.',
    tab: 'Punch List',
  },
  {
    title: 'RFIs, Change Orders & Submittals',
    description: 'RFIs track questions needing answers (Open → Answered → Closed). Change Orders track scope/cost changes — when approved, the approved amount is set automatically. Submittals track product approvals. All counts show in Overview.',
    tab: 'RFIs',
  },
  {
    title: 'Photos & Files',
    description: 'Upload project photos (before/after tagging) and documents (contracts, permits, PDFs). Hover to view, download, or delete. Photo and file counts show in Overview.',
    tab: 'Photos',
  },
  {
    title: 'Team',
    description: 'Assign team members to this project with roles. Team members can be assigned to jobs and tasks within the project.',
    tab: 'Team',
  },
  {
    title: 'You\'re all set!',
    description: 'Everything is connected — schedule tasks update phases, phases update progress, expenses feed into budget and overview stats. Start by adding phases in Timeline, then sync them to Schedule.',
    tab: 'Overview',
  },
]

export function ProjectTour({ projectId }: { projectId: string }) {
  const [step, setStep] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const key = `project-tour-seen-${projectId}`
    const globalKey = 'project-tour-completed'
    if (!localStorage.getItem(globalKey)) {
      setShow(true)
    }
  }, [projectId])

  function handleSkip() {
    localStorage.setItem('project-tour-completed', 'true')
    setShow(false)
  }

  function handleNext() {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      localStorage.setItem('project-tour-completed', 'true')
      setShow(false)
    }
  }

  function handlePrev() {
    if (step > 0) setStep(step - 1)
  }

  if (!show) return null

  const current = TOUR_STEPS[step]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative z-[61] w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <span className="text-xs text-blue-600 font-medium">{step + 1} of {TOUR_STEPS.length}</span>
            <button onClick={handleSkip} className="p-1 text-gray-400 hover:text-gray-600 -mt-1 -mr-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab indicator */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-500 mb-3">
            {current.tab}
          </div>

          {/* Content */}
          <h2 className="text-lg font-bold text-gray-900 mb-2">{current.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{current.description}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {step === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
              {step < TOUR_STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
