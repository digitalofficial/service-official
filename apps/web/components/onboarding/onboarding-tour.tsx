'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ArrowRight, Palette, Users, Briefcase, Receipt, Sparkles } from 'lucide-react'

const TOUR_STEPS = [
  {
    target: null, // centered modal, no target
    title: 'Welcome to Service Official!',
    description: 'Let\'s take a quick tour so you can hit the ground running. We\'ll show you how to set up your brand, add customers, dispatch jobs, and get paid.',
    icon: Sparkles,
    position: 'center' as const,
  },
  {
    target: '[data-tour="settings"]',
    title: 'Customize Your Brand',
    description: 'Head to Settings, then Branding to upload your company logo and set your brand colors. Your invoices, estimates, and customer emails will all be custom-branded with your look.',
    icon: Palette,
    position: 'right' as const,
  },
  {
    target: '[data-tour="customers"]',
    title: 'Add Your First Customer',
    description: 'Start by adding your customers here. Once you have customers, you can create estimates, schedule jobs, and send invoices for them.',
    icon: Users,
    position: 'right' as const,
  },
  {
    target: '[data-tour="dispatch"]',
    title: 'Dispatch Your First Job',
    description: 'Create and schedule jobs, assign them to your crew, and track progress in real time. Your team gets SMS notifications when jobs are assigned.',
    icon: Briefcase,
    position: 'right' as const,
  },
  {
    target: '[data-tour="invoices"]',
    title: 'Get Paid Faster',
    description: 'Create professional, branded invoices and send them directly to your customers. They can view and pay online instantly. You\'ll be notified when they pay.',
    icon: Receipt,
    position: 'right' as const,
  },
]

interface OnboardingTourProps {
  profileId: string
}

export function OnboardingTour({ profileId }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Check localStorage to avoid flashing the tour on repeat visits
  useEffect(() => {
    if (localStorage.getItem('so-tour-done')) return
    // Small delay so the dashboard renders first
    const timer = setTimeout(() => setIsVisible(true), 800)
    return () => clearTimeout(timer)
  }, [])

  const updateTargetRect = useCallback(() => {
    const step = TOUR_STEPS[currentStep]
    if (!step?.target) {
      setTargetRect(null)
      return
    }
    const el = document.querySelector(step.target)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
    } else {
      setTargetRect(null)
    }
  }, [currentStep])

  useEffect(() => {
    if (!isVisible) return
    updateTargetRect()
    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)
    return () => {
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
    }
  }, [isVisible, updateTargetRect])

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

  if (!isVisible) return null

  const step = TOUR_STEPS[currentStep]
  const Icon = step.icon
  const isCenter = step.position === 'center'
  const isLast = currentStep === TOUR_STEPS.length - 1

  // Calculate popover position
  let popoverStyle: React.CSSProperties = {}
  if (isCenter) {
    popoverStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  } else if (targetRect) {
    popoverStyle = {
      position: 'fixed',
      top: targetRect.top - 8,
      left: targetRect.right + 16,
    }
    // If popover would go off-screen right, position below instead
    if (targetRect.right + 380 > window.innerWidth) {
      popoverStyle = {
        position: 'fixed',
        top: targetRect.bottom + 12,
        left: Math.max(16, targetRect.left - 100),
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={completeTour} />

      {/* Spotlight on target element */}
      {targetRect && (
        <div
          className="absolute rounded-lg ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            zIndex: 101,
          }}
        />
      )}

      {/* Popover card */}
      <div
        ref={popoverRef}
        style={{ ...popoverStyle, zIndex: 102 }}
        className="w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header with icon */}
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
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between">
          {/* Step dots */}
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-blue-600' : i < currentStep ? 'bg-blue-300' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={completeTour} className="text-sm text-gray-400 hover:text-gray-600">
              Skip tour
            </button>
            <button
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isLast ? 'Get started' : 'Next'}
              {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
