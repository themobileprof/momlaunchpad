import type { BadgeRequestDetails, CommunityBadgeRequest } from '../api/types'

export function formatBadgeRequestDetails(details?: BadgeRequestDetails): string[] {
  if (!details) return []
  const lines: string[] = []
  if (details.workplace?.trim()) lines.push(`Workplace: ${details.workplace.trim()}`)
  if (details.role_title?.trim()) lines.push(`Role: ${details.role_title.trim()}`)
  if (details.credential_id?.trim()) lines.push(`Credential: ${details.credential_id.trim()}`)
  if (details.verification_url?.trim()) lines.push(`Link: ${details.verification_url.trim()}`)
  return lines
}

export function formatUserLocation(req: CommunityBadgeRequest): string {
  const parts = [req.user_city, req.user_state_province, req.user_country || req.user_country_code]
    .map((p) => p?.trim())
    .filter(Boolean)
  return parts.join(', ')
}
