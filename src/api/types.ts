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
  admin_note?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
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
