import type { CommunityBadgeType, MyCommunityBadges } from '../types'

/** Badge keys that identify healthcare / clinic ambassadors on home and profile. */
export const PROFESSIONAL_BADGE_KEYS = [
  'doctor',
  'midwife',
  'pediatrician',
  'nurse',
  'lactation_consultant',
  'ambassador',
] as const

export type ProfessionalBadgeKey = (typeof PROFESSIONAL_BADGE_KEYS)[number]

const PROFESSIONAL_BADGE_SET = new Set<string>(PROFESSIONAL_BADGE_KEYS)

export function isProfessionalBadgeKey(key: string): boolean {
  return PROFESSIONAL_BADGE_SET.has(key)
}

export function hasProfessionalBadge(badges: string[]): boolean {
  return badges.some(isProfessionalBadgeKey)
}

export function primaryProfessionalBadgeKey(badges: string[]): string | null {
  for (const key of PROFESSIONAL_BADGE_KEYS) {
    if (badges.includes(key)) return key
  }
  return null
}

export function badgeLabelForKey(
  key: string,
  catalog: CommunityBadgeType[] = [],
): string {
  const match = catalog.find((t) => t.key === key)
  return match?.label ?? key.replace(/_/g, ' ')
}

export function primaryProfessionalBadgeLabel(data: MyCommunityBadges): string | null {
  const key = primaryProfessionalBadgeKey(data.badges)
  if (!key) return null
  return badgeLabelForKey(key, data.requestable_types)
}

export function pendingRequestFor(
  data: MyCommunityBadges,
  badgeType: string,
) {
  return data.requests.find((r) => r.badge_type === badgeType && r.status === 'pending')
}
