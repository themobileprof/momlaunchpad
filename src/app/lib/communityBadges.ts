import type { BadgeRequestDetails, CommunityBadgeType, MyCommunityBadges } from '../types'

export const PROFESSIONAL_BADGE_KEYS = [
  'doctor',
  'midwife',
  'pediatrician',
  'nurse',
  'lactation_consultant',
  'ambassador',
] as const

/** Clinical badges that require a license/registration number. */
export const CREDENTIAL_REQUIRED_BADGE_KEYS = [
  'doctor',
  'midwife',
  'pediatrician',
  'nurse',
  'lactation_consultant',
] as const

export type ProfessionalBadgeKey = (typeof PROFESSIONAL_BADGE_KEYS)[number]

const PROFESSIONAL_BADGE_SET = new Set<string>(PROFESSIONAL_BADGE_KEYS)
const CREDENTIAL_REQUIRED_SET = new Set<string>(CREDENTIAL_REQUIRED_BADGE_KEYS)

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

export function credentialRequiredForBadge(badgeType: string): boolean {
  return CREDENTIAL_REQUIRED_SET.has(badgeType)
}

export function emptyBadgeRequestDetails(): BadgeRequestDetails {
  return {
    workplace: '',
    role_title: '',
    credential_id: '',
    verification_url: '',
  }
}

export function validateBadgeRequestDetails(
  badgeType: string,
  details: BadgeRequestDetails,
): string | null {
  if (!details.workplace.trim()) return 'Workplace or facility is required'
  if (!details.role_title.trim()) return 'Role or job title is required'
  if (credentialRequiredForBadge(badgeType) && !details.credential_id?.trim()) {
    return 'License or registration number is required for this badge'
  }
  const url = details.verification_url?.trim()
  if (url) {
    try {
      const parsed = new URL(url)
      if (!parsed.protocol.startsWith('http')) {
        return 'Verification link must be a valid URL'
      }
    } catch {
      return 'Verification link must be a valid URL'
    }
  }
  return null
}

export function formatBadgeRequestDetails(details?: BadgeRequestDetails): string[] {
  if (!details) return []
  const lines: string[] = []
  if (details.workplace?.trim()) lines.push(`Workplace: ${details.workplace.trim()}`)
  if (details.role_title?.trim()) lines.push(`Role: ${details.role_title.trim()}`)
  if (details.credential_id?.trim()) {
    lines.push(`Credential: ${details.credential_id.trim()}`)
  }
  if (details.verification_url?.trim()) {
    lines.push(`Link: ${details.verification_url.trim()}`)
  }
  return lines
}

export function formatUserLocation(req: {
  user_city?: string
  user_state_province?: string
  user_country?: string
  user_country_code?: string
}): string {
  const parts = [req.user_city, req.user_state_province, req.user_country || req.user_country_code]
    .map((p) => p?.trim())
    .filter(Boolean)
  return parts.join(', ')
}
