export interface UserInfo {
  id: string
  email: string
  name?: string
  language: string
  is_admin: boolean
}

export interface ReferralRewardPreset {
  label: string
  description: string
}

export interface AdminCatalogSection {
  id: string
  label: string
}

export interface AdminConfig {
  quota_periods: string[]
  report_statuses: string[]
  post_statuses: string[]
  default_report_status: string
  catalog_sections: AdminCatalogSection[]
  referral_reward_presets: ReferralRewardPreset[]
}

/** Admin lookup by email — id is for API calls only. */
export interface AdminUserSummary {
  id: string
  email: string
  name?: string
  language: string
  referral_code?: string
  plan_code?: string
  referral_reward_points?: number
  is_admin?: boolean
  is_test_user?: boolean
  created_at?: string
}

export interface AuthResponse {
  token: string
  user: UserInfo
}

export interface Plan {
  id: number
  code: string
  name: string
  description: string
  active: boolean
  created_at: string
}

export interface Feature {
  id: number
  feature_key: string
  name: string
  description: string
  created_at: string
}

export interface PlanFeature {
  feature_id: number
  feature_key: string
  feature_name: string
  quota_limit: number | null
  quota_period: string
}

export interface Language {
  code: string
  name: string
  native_name: string
  is_enabled: boolean
  is_experimental: boolean
  created_at: string
}

export interface SystemSetting {
  key: string
  value: string
  description?: string
  updated_at?: string
}

export interface UserStats {
  total_users: number
  active_users_7_days: number
  active_users_30_days: number
  users_by_plan: Record<string, number>
  users_by_language: Record<string, number>
}

/** Per-platform usage rollup (mobile vs web) over a period. */
export interface PlatformUsage {
  platform: string
  /** Raw home/app opens — session-dependent, shown for context only. */
  events: number
  /** Distinct users over the whole window (unique reach). */
  users: number
  /** Sum of distinct active user-days over the window. */
  active_days: number
  /** Average distinct active users per day — the session-independent metric. */
  avg_daily_usr: number
}

/** One platform's distinct active users on a single day. */
export interface PlatformDay {
  day: string
  platform: string
  users: number
  events: number
}

export interface TopicAnalytic {
  intent: string
  count: number
  percentage: number
  sample_query: string
}

/** User rating + optional testimonial (full text — admin only, not in GA4). */
export interface UserFeedback {
  id: string
  user_id: string
  user_email?: string
  user_name?: string
  rating: number
  message?: string
  created_at: string
}

export interface VoiceCall {
  call_sid: string
  user_id: string
  user_email: string
  phone_number: string
  duration_seconds: number
  status: string
  created_at: string
}

export interface QuotaStats {
  total_users: number
  total_usage: number
  average_usage: number
  users_at_limit: number
  users_over_limit: number
}

export interface UserSubscription {
  id: number
  user_id: string
  plan_id: number
  plan_code: string
  status: string
  starts_at: string
  ends_at: string | null
}

export interface QuotaInfo {
  quota_limit: number | null
  quota_period: string
  usage_count: number
  period_start?: string
  period_end?: string
}

export interface CommunityReport {
  id: string
  reporter_id: string
  target_type: string
  target_id: string
  reason: string
  details?: string
  status: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export interface CommunityUserBadge {
  badge_type: string
  label: string
  verified_at: string
  verified_by?: string
}

export interface CommunityBadgeHolder {
  user_id: string
  email: string
  name?: string
  badge_type: string
  label: string
  verified_at: string
}

export interface CommunityBadgeRequest {
  id: string
  user_id: string
  badge_type: string
  status: string
  message?: string
  details?: BadgeRequestDetails
  admin_note?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
  user_city?: string
  user_state_province?: string
  user_country?: string
  user_country_code?: string
}

export interface FacilityAdminClaim {
  id: string
  user_id: string
  healthcare_facility_id: string
  status: string
  role_title?: string
  proof_note?: string
  proof_url?: string
  admin_note?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
  user_phone?: string
  facility_name?: string
  facility_city?: string
  facility_state_province?: string
  facility_country_code?: string
}

export interface BadgeRequestDetails {
  workplace: string
  role_title: string
  credential_id?: string
  verification_url?: string
}

export interface CatalogKeyLabel {
  key: string
  label: string
  sort_order: number
  is_enabled: boolean
  created_at?: string
  updated_at?: string
  group_key?: string
  description?: string
}

export interface CommunityInterest extends CatalogKeyLabel {
  group_key: string
}

export interface CommunityCountry {
  code: string
  name: string
  sort_order: number
  is_enabled: boolean
}

export interface CommunityRegion {
  id: string
  country_code: string
  code: string
  name: string
  sort_order: number
  is_enabled: boolean
}

export interface ReferralLeaderboardEntry {
  user_id: string
  email: string
  name?: string
  referral_code: string
  referral_reward_points: number
  total_referrals: number
  created_at: string
}

export interface ReferralRewardRecord {
  id: number
  user_id: string
  referrals_count: number
  reward_description: string
  rewarded_by_admin_id: string
  created_at: string
}
