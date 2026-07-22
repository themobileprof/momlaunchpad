export type JourneyStage = 'ttc' | 'pregnant' | 'postpartum' | 'miscarriage'

export type BabyGender = 'girl' | 'boy' | 'unknown'

export interface AppUser {
  id: string
  email: string
  name?: string
  language: string
  is_admin: boolean
}

export interface UserProfile {
  name: string
  language: string
  onboarding_completed: boolean
  journey_stage?: JourneyStage
  journey_stage_since?: string
  baby_birth_date?: string
  loss_date?: string
  expected_delivery_date?: string
  pregnancy_start_date?: string
  pregnancy_week?: number
  is_first_pregnancy?: boolean
  baby_gender?: BabyGender
  primary_concern?: string
  diet_preference?: string
  learned_facts?: Record<string, string>
  facts?: Record<string, string>
  profile_photo_url?: string
  country?: string
  country_code?: string
  state_province?: string
  city?: string
  community_onboarding_completed: boolean
  community_interests: string[]
  referral_code: string
  referral_link: string
  referral_reward_points: number
  total_referrals: number
}

export interface WelcomeMessage {
  message: string
  cache_date: string
  source: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  is_starred: boolean
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  content: string
  is_user: boolean
  timestamp: string
  is_streaming?: boolean
}

export type WsMessageType = 'message' | 'done' | 'calendar' | 'title_updated' | 'error'

export interface WsFrame {
  type: WsMessageType
  content?: string
  data?: Record<string, unknown>
  message?: string
}

export interface Reminder {
  id: string
  user_id: string
  title: string
  description?: string
  reminder_time: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_completed: boolean
  community_event_id?: string
  google_calendar_event_id?: string
  created_at: string
  updated_at?: string
}

export type CommunityFeedFilter = 'for_you' | 'nearby' | 'events' | 'my_posts'

export interface CommunityAuthor {
  id?: string
  display_name: string
  photo_url?: string
  badges: string[]
}

export interface CommunityPost {
  id: string
  body: string
  is_anonymous: boolean
  category: string
  scope: string
  medical_relevance: string
  is_event: boolean
  like_count: number
  reply_count: number
  liked_by_me: boolean
  country?: string
  state_province?: string
  city?: string
  created_at: string
  author: CommunityAuthor
  image_urls: string[]
}

export interface CommunityReply {
  id: string
  post_id: string
  body: string
  is_anonymous: boolean
  like_count: number
  liked_by_me: boolean
  created_at: string
  author: CommunityAuthor
}

export interface CommunityEvent {
  id: string
  post_id: string
  event_type?: string
  title: string
  description?: string
  venue?: string
  starts_at: string
  ends_at?: string
  country?: string
  state_province?: string
  city?: string
  interested_count: number
  interested_by_me: boolean
}

export interface CommunityNotification {
  id: string
  type: string
  title: string
  body: string
  payload: Record<string, unknown>
  read_at?: string
  created_at: string
}

/** General (non-community) notification: rewards, referral rewards, system messages. */
export interface AppNotification {
  id: string
  type: 'reward' | 'referral_reward' | 'system' | string
  title: string
  body: string
  payload: {
    reward_kind?: 'topup_code' | 'store_discount' | 'message'
    code?: string
    value?: string
    provider?: string
    expires_at?: string
    referrals_count?: number
    [key: string]: unknown
  }
  read_at?: string
  created_at: string
}

export interface CommunityStatus {
  community_onboarding_completed: boolean
  country?: string
  state_province?: string
  city?: string
  interests: string[]
}

export interface CommunityInterestGroup {
  key: string
  label: string
  items: { key: string; label: string }[]
}

export interface CommunityCountry {
  code: string
  name: string
}

export interface CommunityBadgeType {
  key: string
  label: string
  description?: string
  sort_order?: number
  is_enabled?: boolean
}

export interface CommunityBadgeRequest {
  id: string
  user_id: string
  badge_type: string
  status: 'pending' | 'approved' | 'rejected' | string
  message?: string
  admin_note?: string
  reviewed_at?: string
  created_at: string
}

export interface CommunityBadgeLimits {
  free: number
  premium: number
}

export interface MyCommunityBadges {
  badges: string[]
  requests: CommunityBadgeRequest[]
  requestable_types: CommunityBadgeType[]
  is_premium: boolean
  badge_limit: number
  badge_slots_used: number
  can_request_more_badges: boolean
  badge_limits: CommunityBadgeLimits
}

export interface CommunityThreadEvaluation {
  conversation_id: string
  title: string
  evaluation_preview: string
  message_count: number
  scope: string
}

export interface QuotaInfo {
  quota_limit: number | null
  quota_period: string
  usage_count: number
  period_start?: string
  period_end?: string
}

export interface VisitMedication {
  name: string
  dosage: string
  frequency: string
  route?: string
  duration?: string
  instructions?: string
}

export interface VisitPendingTest {
  test_name: string
  due_by?: string
  status: string
  notes?: string
}

export interface DoctorVisit {
  id: string
  user_id: string
  visit_date: string
  visit_type: string
  provider_name?: string
  facility_name?: string
  next_appointment_at?: string
  next_appointment_notes?: string
  pending_tests: VisitPendingTest[]
  debrief_completed_at?: string
  medications?: VisitMedication[]
  created_at: string
  updated_at: string
}

export interface VisitDebriefPayload {
  pending_tests: VisitPendingTest[]
  medications?: VisitMedication[]
  mark_completed: boolean
}

export const DOCTOR_VISIT_TYPES = [
  'prenatal_checkup',
  'ultrasound',
  'lab_work',
  'specialist',
  'emergency',
  'postpartum',
  'other',
] as const

export const DOCTOR_VISIT_TYPE_LABELS: Record<string, string> = {
  prenatal_checkup: 'Prenatal checkup',
  ultrasound: 'Ultrasound',
  lab_work: 'Lab work',
  specialist: 'Specialist visit',
  emergency: 'Emergency',
  postpartum: 'Postpartum',
  other: 'Other',
}

export const JOURNEY_STAGES: {
  value: JourneyStage
  label: string
  description: string
  signup?: boolean
}[] = [
  {
    value: 'pregnant',
    label: 'Currently pregnant',
    description: 'Stage-matched guidance through your pregnancy.',
    signup: true,
  },
  {
    value: 'ttc',
    label: 'Trying to conceive',
    description: 'Support through fertility questions, cycles, and the wait.',
    signup: true,
  },
  {
    value: 'postpartum',
    label: 'Postpartum',
    description: 'Recovery and wellbeing after birth — focused on you.',
  },
  {
    value: 'miscarriage',
    label: 'Pregnancy loss',
    description: 'Gentle support after miscarriage or pregnancy loss.',
  },
]
