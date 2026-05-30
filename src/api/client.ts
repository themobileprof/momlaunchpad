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

  // Users
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
}
