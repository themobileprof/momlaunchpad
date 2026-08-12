import { ApiError } from '../api/client'
import type {
  AppNotification,
  AppUser,
  ChatMessage,
  CommunityCountry,
  CommunityHealthcareFacility,
  CommunityBadgeRequest,
  CommunityEvent,
  MyCommunityBadges,
  CommunityFeedFilter,
  CommunityInterestGroup,
  CommunityNotification,
  CommunityPost,
  CommunityReply,
  CommunityStatus,
  CommunityThreadEvaluation,
  Conversation,
  DoctorVisit,
  FacilityAdminClaim,
  FacilityAnnouncement,
  FacilityMember,
  QuotaInfo,
  Reminder,
  UserProfile,
  VisitDebriefPayload,
  WelcomeMessage,
} from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const USER_TOKEN_KEY = 'user_token'

export function getUserToken(): string | null {
  return localStorage.getItem(USER_TOKEN_KEY)
}

export function setUserToken(token: string | null) {
  if (token) localStorage.setItem(USER_TOKEN_KEY, token)
  else localStorage.removeItem(USER_TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  const token = getUserToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.error ?? body.message ?? message
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const userApi = {
  register: (body: {
    email: string
    password: string
    name: string
    phone_number?: string
    referral_code?: string
  }) =>
    request<{ token: string; user: AppUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...body, language: 'en' }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: AppUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** Fire-and-forget usage ping (mobile vs web comparison). Never throws. */
  trackUsage: (event = 'home_view') =>
    request<void>('/api/usage/track', {
      method: 'POST',
      body: JSON.stringify({ event, platform: 'web' }),
    }).catch(() => {}),

  googleSignIn: (idToken: string, referralCode?: string) =>
    request<{ token: string; user: AppUser }>('/api/auth/google/token', {
      method: 'POST',
      body: JSON.stringify({
        id_token: idToken,
        ...(referralCode ? { referral_code: referralCode } : {}),
      }),
    }),

  refresh: () =>
    request<{ token: string; user: AppUser }>('/api/auth/refresh', { method: 'POST' }),

  me: () => request<AppUser>('/api/auth/me'),

  getProfile: () => request<UserProfile>('/api/users/me/profile'),

  completeOnboarding: (body: Record<string, unknown>) =>
    request<UserProfile>('/api/users/me/onboarding', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  updateProfile: (body: Record<string, unknown>) =>
    request<UserProfile>('/api/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  uploadProfilePhoto: async (file: File) => {
    const token = getUserToken()
    const form = new FormData()
    form.append('photo', file)
    const res = await fetch(`${API_BASE}/api/users/me/profile-photo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) {
      let message = res.statusText
      try {
        const body = await res.json()
        message = body.error ?? message
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, message)
    }
    return res.json() as Promise<UserProfile>
  },

  getWelcome: () => request<WelcomeMessage>('/api/users/me/welcome'),

  getQuota: (feature: string) =>
    request<{ feature: string; quota: QuotaInfo }>(`/api/subscription/quota/${feature}`),

  uploadCommunityImage: async (file: File) => {
    const token = getUserToken()
    const form = new FormData()
    form.append('image', file)
    const res = await fetch(`${API_BASE}/api/community/uploads`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) {
      let message = res.statusText
      try {
        const body = await res.json()
        message = body.error ?? message
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, message)
    }
    return res.json() as Promise<{ url: string }>
  },

  // Conversations
  listConversations: (limit = 50, offset = 0) =>
    request<Conversation[]>(`/api/conversations?limit=${limit}&offset=${offset}`),

  createConversation: (title: string) =>
    request<Conversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  getConversation: (id: string) => request<Conversation>(`/api/conversations/${id}`),

  updateConversation: (id: string, body: { title?: string; is_starred?: boolean }) =>
    request(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteConversation: (id: string) =>
    request(`/api/conversations/${id}`, { method: 'DELETE' }),

  getMessages: (conversationId: string) =>
    request<ChatMessage[]>(`/api/conversations/${conversationId}/messages`).then((rows) =>
      rows.map((m) => ({
        ...m,
        is_user: (m as { role?: string }).role === 'user' || m.is_user,
        timestamp: (m as { created_at?: string }).created_at ?? m.timestamp,
      })),
    ),

  // Reminders
  listReminders: () => request<Reminder[]>('/api/reminders'),

  createReminder: (body: {
    title: string
    description?: string
    reminder_time: string
    priority: string
  }) =>
    request<Reminder>('/api/reminders', { method: 'POST', body: JSON.stringify(body) }),

  updateReminder: (
    id: string,
    body: Partial<{
      title: string
      description: string
      reminder_time: string
      priority: string
      is_completed: boolean
      google_calendar_event_id: string
    }>,
  ) => request<Reminder>(`/api/reminders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteReminder: (id: string) => request(`/api/reminders/${id}`, { method: 'DELETE' }),

  // Doctor visits
  listDoctorVisits: () => request<DoctorVisit[]>('/api/doctor-visits'),

  createDoctorVisit: (body: Record<string, unknown>) =>
    request<DoctorVisit>('/api/doctor-visits', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateDoctorVisit: (id: string, body: Record<string, unknown>) =>
    request<DoctorVisit>(`/api/doctor-visits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  debriefDoctorVisit: (id: string, body: VisitDebriefPayload) =>
    request<DoctorVisit>(`/api/doctor-visits/${id}/debrief`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Community
  getCommunityStatus: () => request<CommunityStatus>('/api/community/status'),

  getCommunityInterests: () =>
    request<{ groups: CommunityInterestGroup[] }>('/api/community/interests'),

  getCommunityCountries: () =>
    request<{ countries: CommunityCountry[] }>('/api/community/locations/countries'),

  getLocationSuggestions: (params: {
    country_code: string
    field: string
    q: string
    state_province?: string
  }) => {
    const q = new URLSearchParams({
      country_code: params.country_code,
      field: params.field,
      q: params.q,
    })
    if (params.state_province) q.set('state_province', params.state_province)
    return request<{ suggestions: string[] }>(
      `/api/community/locations/suggestions?${q}`,
    )
  },

  getHealthcareFacilities: (params: {
    country_code: string
    state_province: string
    city: string
    q: string
  }) => {
    const q = new URLSearchParams({
      country_code: params.country_code,
      state_province: params.state_province,
      city: params.city,
      q: params.q,
    })
    return request<{ facilities: CommunityHealthcareFacility[] }>(
      `/api/community/locations/healthcare-facilities?${q}`,
    )
  },

  completeCommunityOnboarding: (body: {
    country_code: string
    state_province: string
    city: string
    healthcare_facility_id?: string
    healthcare_facility_name?: string
    interests: string[]
  }) =>
    request<CommunityStatus>('/api/community/onboarding', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getCommunityFeed: (filter: CommunityFeedFilter, cursor?: string, limit = 20) => {
    const q = new URLSearchParams({ filter, limit: String(limit) })
    if (cursor) q.set('cursor', cursor)
    return request<{ posts: CommunityPost[]; next_cursor?: string }>(
      `/api/community/feed?${q}`,
    )
  },

  createPost: (body: {
    body: string
    is_anonymous?: boolean
    image_urls?: string[]
    event?: {
      event_type: string
      title: string
      description?: string
      venue?: string
      starts_at: string
      ends_at?: string
    }
  }) =>
    request<CommunityPost>('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getPost: (id: string) => request<CommunityPost>(`/api/community/posts/${id}`),

  getReplies: (postId: string) =>
    request<{ replies: CommunityReply[] }>(`/api/community/posts/${postId}/replies`),

  createReply: (postId: string, body: string, isAnonymous = false) =>
    request<CommunityReply>(`/api/community/posts/${postId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ body, is_anonymous: isAnonymous }),
    }),

  togglePostLike: (postId: string) =>
    request<{ liked: boolean; like_count: number }>(
      `/api/community/posts/${postId}/like`,
      { method: 'POST' },
    ),

  toggleReplyLike: (replyId: string) =>
    request<{ liked: boolean; like_count: number }>(
      `/api/community/replies/${replyId}/like`,
      { method: 'POST' },
    ),

  evaluateForMe: (postId: string, replyId?: string) =>
    request<CommunityThreadEvaluation>(
      `/api/community/posts/${postId}/evaluate-for-me`,
      {
        method: 'POST',
        body: JSON.stringify(replyId ? { reply_id: replyId } : {}),
      },
    ),

  getEvent: (postId: string) =>
    request<CommunityEvent>(`/api/community/posts/${postId}/event`).catch((e) => {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }),

  toggleEventInterest: (eventId: string) =>
    request<{ interested: boolean; interested_count: number }>(
      `/api/community/events/${eventId}/interested`,
      { method: 'POST' },
    ),

  hidePost: (postId: string) =>
    request(`/api/community/posts/${postId}/hide`, { method: 'POST' }),

  reportPost: (postId: string, reason: string, details?: string) =>
    request(`/api/community/posts/${postId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, details }),
    }),

  reportReply: (replyId: string, reason: string, details?: string) =>
    request(`/api/community/replies/${replyId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, details }),
    }),

  blockUser: (userId: string) =>
    request(`/api/community/users/${userId}/block`, { method: 'POST' }),

  getNotifications: () =>
    request<{ notifications: CommunityNotification[] }>('/api/community/notifications'),

  markNotificationRead: (id: string) =>
    request(`/api/community/notifications/${id}/read`, { method: 'PUT' }),

  getEventTypes: () =>
    request<{ event_types: { key: string; label: string }[] }>(
      '/api/community/event-types',
    ),

  getMyCommunityBadges: () =>
    request<MyCommunityBadges>('/api/community/me/badges'),

  createCommunityBadgeRequest: (
    badge_type: string,
    details: import('./types').BadgeRequestDetails,
    message?: string,
  ) =>
    request<{ request: CommunityBadgeRequest }>('/api/community/me/badge-requests', {
      method: 'POST',
      body: JSON.stringify({
        badge_type,
        details: {
          workplace: details.workplace.trim(),
          role_title: details.role_title.trim(),
          ...(details.credential_id?.trim()
            ? { credential_id: details.credential_id.trim() }
            : {}),
          ...(details.verification_url?.trim()
            ? { verification_url: details.verification_url.trim() }
            : {}),
        },
        ...(message?.trim() ? { message: message.trim() } : {}),
      }),
    }),

  getMyFacilityAdmin: () =>
    request<{
      claims: FacilityAdminClaim[]
      approved: FacilityAdminClaim[]
    }>('/api/community/facility-admin/me'),

  createFacilityAdminClaim: (body: {
    healthcare_facility_id: string
    role_title?: string
    proof_note?: string
    proof_url?: string
  }) =>
    request<{ claim: FacilityAdminClaim }>('/api/community/facility-admin/claims', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listFacilityMembers: (facilityId: string, limit = 50, offset = 0) =>
    request<{ members: FacilityMember[]; total: number }>(
      `/api/community/facility-admin/facilities/${facilityId}/members?limit=${limit}&offset=${offset}`,
    ),

  createFacilityAnnouncement: (facilityId: string, title: string, body: string) =>
    request<{ announcement: FacilityAnnouncement }>(
      `/api/community/facility-admin/facilities/${facilityId}/announcements`,
      {
        method: 'POST',
        body: JSON.stringify({ title, body }),
      },
    ),

  // General notification / reward inbox
  getInboxNotifications: () =>
    request<{ notifications: AppNotification[] }>('/api/notifications'),

  getInboxUnreadCount: () =>
    request<{ unread: number }>('/api/notifications/unread-count'),

  markInboxRead: (id: string) =>
    request(`/api/notifications/${id}/read`, { method: 'PUT' }),

  markAllInboxRead: () =>
    request('/api/notifications/read-all', { method: 'POST' }),
}

export function getWsChatUrl(conversationId?: string): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? ''
  let origin: string
  if (apiBase) {
    const u = new URL(apiBase)
    origin = `${u.protocol === 'https:' ? 'wss:' : 'ws:'}//${u.host}`
  } else {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    origin = `${proto}//${window.location.host}`
  }
  const token = getUserToken()
  const params = new URLSearchParams()
  if (token) params.set('token', token)
  if (conversationId) params.set('conversation_id', conversationId)
  return `${origin}/ws/chat?${params}`
}
