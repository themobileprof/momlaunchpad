const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('admin_token', token)
  else localStorage.removeItem('admin_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const token = getToken()
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

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: import('./types').UserInfo }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<import('./types').UserInfo>('/api/auth/me'),

  getAdminConfig: () => request<import('./types').AdminConfig>('/api/admin/config'),

  // Plans
  listPlans: () => request<{ plans: import('./types').Plan[] }>('/api/admin/plans'),
  createPlan: (body: { code: string; name: string; description: string }) =>
    request('/api/admin/plans', { method: 'POST', body: JSON.stringify(body) }),
  updatePlan: (planId: number, body: { name?: string; description?: string; active?: boolean }) =>
    request(`/api/admin/plans/${planId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePlan: (planId: number) =>
    request(`/api/admin/plans/${planId}`, { method: 'DELETE' }),
  getPlanFeatures: (planId: number) =>
    request<{ features: import('./types').PlanFeature[] }>(`/api/admin/plans/${planId}/features`),
  assignFeatureToPlan: (
    planId: number,
    featureId: number,
    body: { quota_limit?: number | null; quota_period: string },
  ) =>
    request(`/api/admin/plans/${planId}/features/${featureId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  removeFeatureFromPlan: (planId: number, featureId: number) =>
    request(`/api/admin/plans/${planId}/features/${featureId}`, { method: 'DELETE' }),

  // Features
  listFeatures: () => request<{ features: import('./types').Feature[] }>('/api/admin/features'),
  createFeature: (body: { feature_key: string; name: string; description: string }) =>
    request('/api/admin/features', { method: 'POST', body: JSON.stringify(body) }),
  updateFeature: (featureId: number, body: { name: string; description: string }) =>
    request(`/api/admin/features/${featureId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteFeature: (featureId: number) =>
    request(`/api/admin/features/${featureId}`, { method: 'DELETE' }),

  // Languages
  listLanguages: () =>
    request<{ languages: import('./types').Language[] }>('/api/admin/languages'),
  createLanguage: (body: {
    code: string
    name: string
    native_name: string
    is_enabled: boolean
    is_experimental: boolean
  }) => request('/api/admin/languages', { method: 'POST', body: JSON.stringify(body) }),
  updateLanguage: (
    code: string,
    body: Partial<{ name: string; native_name: string; is_enabled: boolean; is_experimental: boolean }>,
  ) => request(`/api/admin/languages/${code}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLanguage: (code: string) =>
    request(`/api/admin/languages/${code}`, { method: 'DELETE' }),

  // Settings
  listSettings: () =>
    request<{ settings: import('./types').SystemSetting[] }>('/api/admin/settings'),
  updateSetting: (key: string, value: string) =>
    request(`/api/admin/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),

  // Analytics
  getUserStats: () => request<{ stats: import('./types').UserStats }>('/api/admin/analytics/users'),
  getTopicAnalytics: (days = 7) =>
    request<{ period_days: number; analytics: import('./types').TopicAnalytic[] }>(
      `/api/admin/analytics/topics?days=${days}`,
    ),
  getCallHistory: (days = 7) =>
    request<{ period_days: number; calls: import('./types').VoiceCall[] }>(
      `/api/admin/analytics/calls?days=${days}`,
    ),
  getQuotaStats: (period = 'today') =>
    request<{ period: string; stats: import('./types').QuotaStats }>(
      `/api/admin/quota/stats?period=${period}`,
    ),
  listFeedback: () =>
    request<{ feedback: import('./types').UserFeedback[] }>(
      '/api/admin/analytics/feedback',
    ),

  // Users
  listUsers: (limit = 100, offset = 0) =>
    request<{ users: import('./types').AdminUserSummary[]; limit: number; offset: number }>(
      `/api/admin/users?limit=${limit}&offset=${offset}`,
    ),

  lookupUserByEmail: (email: string) =>
    request<{ users: import('./types').AdminUserSummary[] }>(
      `/api/admin/users/search?email=${encodeURIComponent(email.trim())}`,
    ),
  setUserAdmin: (userId: string, is_admin: boolean) =>
    request<{ message: string; user_id: string; is_admin: boolean }>(
      `/api/admin/users/${userId}/admin`,
      { method: 'PUT', body: JSON.stringify({ is_admin }) },
    ),
  deleteUser: (userId: string) =>
    request<{ message: string; user_id: string }>(
      `/api/admin/users/${userId}`,
      { method: 'DELETE' },
    ),

  getUserSubscription: (userId: string) =>
    request<{ user_id: string; subscription: import('./types').UserSubscription }>(
      `/api/admin/users/${userId}/subscription`,
    ),
  updateUserPlan: (userId: string, plan_code: string) =>
    request(`/api/admin/users/${userId}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ plan_code }),
    }),
  getUserQuota: (userId: string, feature: string) =>
    request<{ user_id: string; feature: string; quota: import('./types').QuotaInfo }>(
      `/api/admin/users/${userId}/quota/${feature}`,
    ),
  resetUserQuota: (userId: string, feature: string) =>
    request(`/api/admin/users/${userId}/quota/${feature}/reset`, { method: 'POST' }),
  grantFeature: (userId: string, feature_key: string, expires_at?: number) =>
    request(`/api/admin/users/${userId}/features`, {
      method: 'POST',
      body: JSON.stringify({ feature_key, expires_at }),
    }),

  // Community moderation
  listCommunityReports: (status = 'open') =>
    request<{ reports: import('./types').CommunityReport[] }>(
      `/api/admin/community/reports?status=${encodeURIComponent(status)}`,
    ),
  updateCommunityReport: (id: string, status: string) =>
    request(`/api/admin/community/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  updateCommunityPostStatus: (postId: string, status: string) =>
    request(`/api/admin/community/posts/${postId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  listUserBadges: (userId: string) =>
    request<{ badges: import('./types').CommunityUserBadge[] }>(
      `/api/admin/community/users/${userId}/badges`,
    ),
  grantCommunityBadge: (userId: string, badge_type: string) =>
    request(`/api/admin/community/users/${userId}/badges`, {
      method: 'POST',
      body: JSON.stringify({ badge_type }),
    }),
  revokeCommunityBadge: (userId: string, badgeType: string) =>
    request(`/api/admin/community/users/${userId}/badges/${encodeURIComponent(badgeType)}`, {
      method: 'DELETE',
    }),
  listBadgeHolders: (badgeType?: string) =>
    request<{ holders: import('./types').CommunityBadgeHolder[] }>(
      `/api/admin/community/badge-holders${
        badgeType ? `?badge_type=${encodeURIComponent(badgeType)}` : ''
      }`,
    ),
  listBadgeRequests: (status = 'pending') =>
    request<{ requests: import('./types').CommunityBadgeRequest[] }>(
      `/api/admin/community/badge-requests?status=${encodeURIComponent(status)}`,
    ),
  approveBadgeRequest: (id: string, admin_note?: string) =>
    request<{ request: import('./types').CommunityBadgeRequest }>(
      `/api/admin/community/badge-requests/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify(admin_note ? { admin_note } : {}),
      },
    ),
  rejectBadgeRequest: (id: string, admin_note?: string) =>
    request<{ request: import('./types').CommunityBadgeRequest }>(
      `/api/admin/community/badge-requests/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify(admin_note ? { admin_note } : {}),
      },
    ),

  // Community catalog
  listInterestGroups: () =>
    request<{ interest_groups: import('./types').CatalogKeyLabel[] }>(
      '/api/admin/community/catalog/interest-groups',
    ),
  upsertInterestGroup: (key: string, body: { label: string; sort_order?: number; is_enabled?: boolean }) =>
    request(`/api/admin/community/catalog/interest-groups/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  listCatalogInterests: () =>
    request<{ interests: import('./types').CommunityInterest[] }>(
      '/api/admin/community/catalog/interests',
    ),
  upsertCatalogInterest: (
    key: string,
    body: { label: string; group_key: string; sort_order?: number; is_enabled?: boolean },
  ) =>
    request(`/api/admin/community/catalog/interests/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  listBadgeTypes: () =>
    request<{ badge_types: import('./types').CatalogKeyLabel[] }>(
      '/api/admin/community/catalog/badge-types',
    ),
  upsertBadgeType: (
    key: string,
    body: { label: string; description?: string; sort_order?: number; is_enabled?: boolean },
  ) =>
    request(`/api/admin/community/catalog/badge-types/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  listEventTypes: () =>
    request<{ event_types: import('./types').CatalogKeyLabel[] }>(
      '/api/admin/community/catalog/event-types',
    ),
  upsertEventType: (
    key: string,
    body: { label: string; description?: string; sort_order?: number; is_enabled?: boolean },
  ) =>
    request(`/api/admin/community/catalog/event-types/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  listCatalogCountries: () =>
    request<{ countries: import('./types').CommunityCountry[] }>(
      '/api/admin/community/catalog/countries',
    ),
  upsertCatalogCountry: (
    code: string,
    body: { name: string; sort_order?: number; is_enabled?: boolean },
  ) =>
    request(`/api/admin/community/catalog/countries/${encodeURIComponent(code)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  listCatalogRegions: (countryCode?: string) => {
    const query = countryCode
      ? `?country_code=${encodeURIComponent(countryCode)}`
      : ''
    return request<{ regions: import('./types').CommunityRegion[] }>(
      `/api/admin/community/catalog/regions${query}`,
    )
  },
  createCatalogRegion: (body: {
    country_code: string
    code: string
    name: string
    sort_order?: number
    is_enabled?: boolean
  }) =>
    request<{ region: import('./types').CommunityRegion }>(
      '/api/admin/community/catalog/regions',
      { method: 'POST', body: JSON.stringify(body) },
    ),
  updateCatalogRegion: (
    id: string,
    body: {
      country_code: string
      code: string
      name: string
      sort_order?: number
      is_enabled?: boolean
    },
  ) =>
    request<{ region: import('./types').CommunityRegion }>(
      `/api/admin/community/catalog/regions/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(body) },
    ),

  // Referrals
  getReferralLeaderboard: (limit = 100) =>
    request<{ entries: import('./types').ReferralLeaderboardEntry[] }>(
      `/api/admin/referrals/leaderboard?limit=${limit}`,
    ),
  grantReferralReward: (userId: string, reward_description: string) =>
    request<{ reward: import('./types').ReferralRewardRecord }>(
      `/api/admin/users/${userId}/referral-reward`,
      { method: 'POST', body: JSON.stringify({ reward_description }) },
    ),
  listUserReferralRewards: (userId: string) =>
    request<{ rewards: import('./types').ReferralRewardRecord[] }>(
      `/api/admin/users/${userId}/referral-rewards`,
    ),

  // Reward / notification delivery to a user's inbox
  sendUserReward: (
    userId: string,
    body: {
      reward_kind: 'topup_code' | 'store_discount' | 'message'
      title?: string
      body: string
      code?: string
      value?: string
      provider?: string
      expires_at?: string
    },
  ) =>
    request(`/api/admin/users/${userId}/rewards`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  sendUserNotification: (userId: string, body: { title: string; body: string }) =>
    request(`/api/admin/users/${userId}/notifications`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
