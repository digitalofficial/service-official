// ============================================================
// TIER-BASED FEATURE GATING
// Controls what features are available per subscription tier.
// ============================================================

export type SubscriptionTier = 'solo' | 'team' | 'growth' | 'enterprise'

export interface TierLimits {
  max_users: number
  features: string[]
}

/**
 * Features available per tier. Each tier inherits from the previous.
 * Feature keys map to sidebar nav hrefs and API route prefixes.
 */
const TIER_CONFIG: Record<SubscriptionTier, TierLimits> = {
  solo: {
    max_users: 1,
    features: [
      '/dashboard',
      '/projects',
      '/jobs',
      '/calendar',
      '/customers',
      '/leads',
      '/estimates',
      '/invoices',
      '/payments',
      '/estimator',
      '/settings',
    ],
  },
  team: {
    max_users: 5,
    features: [
      '/dashboard',
      '/projects',
      '/jobs',
      '/calendar',
      '/customers',
      '/leads',
      '/estimates',
      '/invoices',
      '/payments',
      '/estimator',
      '/team',
      '/dispatch',
      '/messages',
      '/settings',
    ],
  },
  growth: {
    max_users: 15,
    features: [
      '/dashboard',
      '/projects',
      '/jobs',
      '/calendar',
      '/customers',
      '/leads',
      '/estimates',
      '/invoices',
      '/payments',
      '/estimator',
      '/team',
      '/dispatch',
      '/messages',
      '/automation',
      '/reports',
      '/settings',
    ],
  },
  enterprise: {
    max_users: Infinity,
    features: ['*'], // Everything
  },
}

/**
 * Get the tier config for a given subscription tier.
 */
export function getTierConfig(tier: string): TierLimits {
  return TIER_CONFIG[(tier as SubscriptionTier)] ?? TIER_CONFIG.solo
}

/**
 * Check if a feature (nav href) is available for a given tier.
 */
export function tierHasFeature(tier: string, feature: string): boolean {
  const config = getTierConfig(tier)
  if (config.features.includes('*')) return true
  return config.features.includes(feature)
}

/**
 * Get max users allowed for a tier.
 */
export function getTierMaxUsers(tier: string): number {
  return getTierConfig(tier).max_users
}

/**
 * Get human-readable tier name for upgrade prompts.
 */
export function getUpgradeTier(currentTier: string, feature: string): string | null {
  const tiers: SubscriptionTier[] = ['solo', 'team', 'growth', 'enterprise']
  const currentIndex = tiers.indexOf(currentTier as SubscriptionTier)

  for (let i = currentIndex + 1; i < tiers.length; i++) {
    if (tierHasFeature(tiers[i], feature)) {
      return tiers[i]
    }
  }
  return null
}

/**
 * Features that require SMS (gated behind team+ tier).
 */
export function tierHasSms(tier: string): boolean {
  return tier === 'team' || tier === 'growth' || tier === 'enterprise'
}
