import type { PublicNest } from '../app/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function publicRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.error ?? body.message ?? message
    } catch {
      /* ignore */
    }
    throw new Error(message || 'Request failed')
  }
  return res.json() as Promise<T>
}

export const publicNestApi = {
  getNest: (token: string) => publicRequest<PublicNest>(`/api/nest/${encodeURIComponent(token)}`),

  contribute: (
    token: string,
    body: {
      display_name: string
      amount: number
      note?: string
      email?: string
      phone?: string
      status?: 'pledged' | 'recorded'
    },
  ) =>
    publicRequest<{ ok: boolean; status: string; message: string }>(
      `/api/nest/${encodeURIComponent(token)}/contributions`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
}
