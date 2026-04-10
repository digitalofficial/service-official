'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, ArrowRight, ArrowLeft, Palette, Users, Briefcase, Receipt, Sparkles, ExternalLink } from 'lucide-react'

const TOUR_STEPS = [
  {
    target: '[data-tour="help"]',
    title: 'Welcome to Service Official!',
    description: 'Let\'s take a quick tour so you can hit the ground running. We\'ll show you how to set up your brand, add customers, dispatch jobs, and get paid.\n\nYou can restart this tour anytime by clicking this help button.',
    icon: Sparkles,
    position: 'bottom' as const,
    actionLabel: null,
    actionHref: null,
  },
  {
    target: '[data-tour="settings"]',
    title: 'Customize Your Brand',
    description: 'Upload your company logo and set your brand colors. Your invoices, estimates, and customer emails will all be custom-branded with your look.',
    icon: Palette,
    position: 'right' as const,
    actionLabel: 'Go to Branding',
    actionHref: '/settings/branding',
  },
  {
    target: '[data-tour="customers"]',
    title: 'Add Your First Customer',
    description: 'Add your customers so you can create estimates, schedule jobs, and send invoices for them.',
    icon: Users,
    position: 'right' as const,
    actionLabel: 'Add a Customer',
    actionHref: '/customers/new',
  },
  {
    target: '[data-tour="dispatch"]',
    title: 'Dispatch Your First Job',
    description: 'Create and schedule jobs, assign them to your crew, and track progress in real time. Your team gets SMS notifications when jobs are assigned.',
    icon: Briefcase,
    position: 'right' as const,
    actionLabel: 'Dispatch a Job',
    actionHref: '/dispatch',
  },
  {
    target: '[data-tour="invoices"]',
    title: 'Get Paid Faster',
    description: 'Create professional, branded invoices and send them directly to your customers. They can view and pay online instantly.',
    icon: Receipt,
    position: 'right' as const,
    actionLabel: 'Create an Invoice',
    actionHref: '/invoices/new',
  },
]

interface OnboardingTourProps {
  profileId: string
}

export function OnboardingTour({ profileId }: OnboardingTourProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Auto-start on first visit
  useEffect(() => {
    if (localStorage.getItem('so-tour-done')) return
    const timer = setTimeout(() => setIsVisible(true), 800)
    return () => clearTimeout(timer)
  }, [])

  // Listen for manual re-trigger from topbar button
  useEffect(() => {
    const handler = () => {
      setCurrentStep(0)
      setIsVisible(true)
    }
    window.addEventListener('start-tour', handler)
    return () => window.removeEventListener('start-tour', handler)
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
    const interval = setInterval(updateTargetRect, 500)
    window.addEventListener('resize', updateTargetRect)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', updateTargetRect)
    }
  }, [isVisible, currentStep, updateTargetRect])

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

  // Calculate popover position and arrow direction
  let popoverStyle: React.CSSProperties = {}
  let arrowPosition: 'top' | 'left' | 'none' = 'none'
  let arrowOffset = 0

  if (targetRect) {
    const popoverWidth = 380
    const rightSpace = window.innerWidth - targetRect.right

    if (step.position === 'bottom') {
      // Position below the target (used for help button)
      popoverStyle = {
        position: 'fixed',
        top: targetRect.bottom + 14,
        right: window.innerWidth - targetRect.right,
      }
      arrowPosition = 'top'
      arrowOffset = Math.min(popoverWidth - 30, targetRect.width / 2 + (window.innerWidth - targetRect.right) - 20)
    } else if (rightSpace > popoverWidth + 24) {
      // Position to the right
      popoverStyle = {
        position: 'fixed',
        top: Math.max(16, targetRect.top - 16),
        left: targetRect.right + 14,
      }
      arrowPosition = 'left'
      arrowOffset = targetRect.height / 2 + 8
    } else {
      // Position below
      popoverStyle = {
        position: 'fixed',
        top: targetRect.bottom + 14,
        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - popoverWidth - 16)),
      }
      arrowPosition = 'top'
      arrowOffset = Math.max(20, targetRect.left + targetRect.width / 2 - (popoverStyle.left as number))
    }
  } else {
    // No target found, center it
    popoverStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  return (
    <>
      {/* Semi-transparent backdrop — click-through disabled only on center step */}
      <div
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      />

      {/* Spotlight on target element — this element IS clickable */}
      {targetRect && (
        <div
          className="fixed rounded-lg z-[101]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Popover card */}
      <div
        ref={popoverRef}
        style={{ ...popoverStyle, zIndex: 102 }}
        className="w-[380px] bg-white rounded-2xl shadow-2xl pointer-events-auto relative"
      >
        {/* Arrow pointing to target */}
        {arrowPosition === 'top' && (
          <div
            className="absolute -top-2 w-4 h-4 bg-blue-600 rotate-45"
            style={{ right: arrowOffset }}
          />
        )}
        {arrowPosition === 'left' && (
          <div
            className="absolute -left-2 w-4 h-4 bg-blue-600 rotate-45"
            style={{ top: arrowOffset }}
          />
        )}
        {/* Header */}
        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between rounded-t-2xl">
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
          {step.description.split('\n').map((line, i) => (
            <p key={i} className={`text-sm text-gray-600 leading-relaxed ${i > 0 ? 'mt-2' : ''}`}>{line}</p>
          ))}

          {/* Action button — lets user do the thing right now */}
          {step.actionHref && (
            <button
              onClick={() => handleAction(step.actionHref!)}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-900 rounded-lg transition-colors w-full justify-center"
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
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
    </>
  )
}
