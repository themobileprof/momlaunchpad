import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, setToken } from './client'

function mockFetch(response: {
  ok?: boolean
  status?: number
  json?: unknown
  reject?: boolean
}) {
  const fn = vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    statusText: 'Error',
    json: async () => response.json ?? {},
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('admin token storage', () => {
  afterEach(() => setToken(null))

  it('persists the token under the admin_token key', () => {
    setToken('admin-jwt')
    expect(localStorage.getItem('admin_token')).toBe('admin-jwt')
  })

  it('removes the token when set to null', () => {
    setToken('admin-jwt')
    setToken(null)
    expect(localStorage.getItem('admin_token')).toBeNull()
  })

  it('is isolated from the user app token key', () => {
    setToken('admin-jwt')
    expect(localStorage.getItem('user_token')).toBeNull()
  })
})

describe('request auth header', () => {
  beforeEach(() => setToken(null))
  afterEach(() => setToken(null))

  it('omits Authorization when no admin token is stored', async () => {
    const fetchMock = mockFetch({ json: { is_admin: true } })
    await api.me()
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('attaches a Bearer token when one is stored', async () => {
    setToken('admin-jwt')
    const fetchMock = mockFetch({ json: { is_admin: true } })
    await api.me()
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer admin-jwt')
  })

  it('always sends JSON content type', async () => {
    const fetchMock = mockFetch({ json: {} })
    await api.me()
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
  })
})

describe('error handling', () => {
  it('throws ApiError carrying the server-provided message and status', async () => {
    mockFetch({ ok: false, status: 403, json: { error: 'This account does not have admin access.' } })
    await expect(api.me()).rejects.toBeInstanceOf(ApiError)
    mockFetch({ ok: false, status: 403, json: { error: 'This account does not have admin access.' } })
    await expect(api.me()).rejects.toMatchObject({
      status: 403,
      message: 'This account does not have admin access.',
    })
  })

  it('does not leak the raw JSON body when parsing fails', async () => {
    const fn = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('not json')
      },
    })
    vi.stubGlobal('fetch', fn)
    await expect(api.me()).rejects.toMatchObject({ status: 500 })
  })
})

describe('login', () => {
  afterEach(() => setToken(null))

  it('POSTs credentials to the auth endpoint', async () => {
    const fetchMock = mockFetch({ json: { token: 't', user: { is_admin: true } } })
    await api.login('admin@example.com', 'secret')
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/api/auth/login')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ email: 'admin@example.com', password: 'secret' })
  })
})
