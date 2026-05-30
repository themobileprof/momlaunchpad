export interface UserInfo {
  id: string
  email: string
  name?: string
  language: string
  is_admin: boolean
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
  total_users?: number
  active_users?: number
  total_usage?: number
  by_feature?: Record<string, number>
  by_plan?: Record<string, number>
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
