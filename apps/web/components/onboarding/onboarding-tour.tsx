'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, ArrowRight, ArrowLeft, Palette, Users, Briefcase, Receipt, Sparkles, ExternalLink } from 'lucide-react'

const TOUR_STEPS = [
  {
    title: 'Welcome to Service Official!',
    description: 'Let\'s take a quick tour so you can hit the ground running. We\'ll show you how to set up your brand, add customers, dispatch jobs, and get paid.',
    note: 'You can restart this tour anytime from the Help menu.',
    icon: Sparkles,
    actionLabel: null,
    actionHref: null,
  },
  {
    title: 'Customize Your Brand',
    description: 'Upload your company logo and set your brand colors. Your invoices, estimates, and customer emails will all be custom-branded with your look.',
    note: null,
    icon: Palette,
    actionLabel: 'Go to Branding',
    actionHref: '/settings/branding',
  },
  {
    title: 'Add Your First Customer',
    description: 'Add your customers so you can create estimates, schedule jobs, and send invoices for them.',
    note: null,
    icon: Users,
    actionLabel: 'Add a Customer',
    actionHref: '/customers/new',
  },
  {
    title: 'Dispatch Your First Job',
    description: 'Create and schedule jobs, assign them to your crew, and track progress in real time. Your team gets SMS notifications when jobs are assigned.',
    note: null,
    icon: Briefcase,
    actionLabel: 'Dispatch a Job',
    actionHref: '/dispatch',
  },
  {
    title: 'Get Paid Faster',
    description: 'Create professional, branded invoices and send them directly to your customers. They can view and pay online instantly.',
    note: null,
    icon: Receipt,
    actionLabel: 'Create an Invoice',
    actionHref: '/invoices/new',
  },
]

interface OnboardingTourProps {
  profileId: string
  onboardingCompleted?: boolean
}

export function OnboardingTour({ profileId, onboardingCompleted }: OnboardingTourProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  // Auto-start on first visit — check both localStorage and DB flag
  useEffect(() => {
    if (localStorage.getItem('so-tour-done')) return
    if (onboardingCompleted) {
      localStorage.setItem('so-tour-done', 'true')
      return
    }
    const timer = setTimeout(() => setIsVisible(true), 800)
    return () => clearTimeout(timer)
  }, [onboardingCompleted])

  // Listen for manual re-trigger from topbar/profile menu
  useEffect(() => {
    const handler = () => {
      setCurrentStep(0)
      setIsVisible(true)
    }
    window.addEventListener('start-tour', handler)
    return () => window.removeEventListener('start-tour', handler)
  }, [])

  const completeTour = useCallback(async () => {
    setIsVisible(false)
    localStorage.setItem('so-tour-done', 'true')
    try {
      await fetch('/api/profile/onboarding', { method: 'PATCH' })
    } catch {}
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length - 1) {
      completeTour()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, completeTour])

  const prevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }, [currentStep])

  const handleAction = (href: string) => {
    completeTour()
    router.push(href)
  }

  if (!isVisible) return null

  const step = TOUR_STEPS[currentStep]
  const Icon = step.icon
  const isLast = currentStep === TOUR_STEPS.length - 1
  const isFirst = currentStep === 0

  return (
    <>
      {/* Backdrop — tapping it dismisses the tour */}
      <div
        className="fixed inset-0 z-[100] bg-black/50"
        onClick={completeTour}
      />

      {/* Centered modal card — works on all screen sizes */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-100 font-medium">Step {currentStep + 1} of {TOUR_STEPS.length}</p>
                <h3 className="text-base font-semibold text-white">{step.title}</h3>
              </div>
            </div>
            <button onClick={completeTour} className="text-blue-200 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4">
            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
            {step.note && (
              <p className="text-xs text-gray-400 mt-3">{step.note}</p>
            )}

            {step.actionHref && (
              <button
                onClick={() => handleAction(step.actionHref!)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-900 rounded-lg transition-colors w-full justify-center"
              >
                <ExternalLink className="w-4 h-4 text-gray-500" />
                {step.actionLabel}
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 flex items-center justify-between">
            {/* Step dots */}
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === currentStep ? 'bg-blue-600' : i < currentStep ? 'bg-blue-300' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={prevStep}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              )}
              {isFirst && (
                <button onClick={completeTour} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2">
                  Skip
                </button>
              )}
              <button
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isLast ? 'Finish' : 'Next'}
                {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
