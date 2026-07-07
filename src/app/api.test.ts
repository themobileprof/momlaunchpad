import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getUserToken, setUserToken, userApi } from './api'

function mockFetch(json: unknown = {}) {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => json,
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('user token storage', () => {
  beforeEach(() => setUserToken(null))
  afterEach(() => setUserToken(null))

  it('persists under a dedicated user_token key (isolated from admin_token)', () => {
    setUserToken('user-jwt')
    expect(localStorage.getItem('user_token')).toBe('user-jwt')
    expect(localStorage.getItem('admin_token')).toBeNull()
    expect(getUserToken()).toBe('user-jwt')
  })

  it('clears the token when set to null', () => {
    setUserToken('user-jwt')
    setUserToken(null)
    expect(getUserToken()).toBeNull()
  })
})

describe('register', () => {
  afterEach(() => setUserToken(null))

  it('sends name/email/password with language and referral_code', async () => {
    const fetchMock = mockFetch({ token: 't', user: {} })
    await userApi.register({
      email: 'mom@example.com',
      password: 'password123',
      name: 'Mom',
      referral_code: 'ABC123',
    })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toMatchObject({
      email: 'mom@example.com',
      name: 'Mom',
      language: 'en',
      referral_code: 'ABC123',
    })
  })
})

describe('googleSignIn', () => {
  afterEach(() => setUserToken(null))

  it('omits referral_code when none is provided', async () => {
    const fetchMock = mockFetch({ token: 't', user: {} })
    await userApi.googleSignIn('id-token')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toEqual({ id_token: 'id-token' })
    expect('referral_code' in body).toBe(false)
  })

  it('includes referral_code when provided', async () => {
    const fetchMock = mockFetch({ token: 't', user: {} })
    await userApi.googleSignIn('id-token', 'REF9')
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.referral_code).toBe('REF9')
  })

  it('attaches the stored user token as a Bearer header on authenticated calls', async () => {
    setUserToken('user-jwt')
    const fetchMock = mockFetch([])
    await userApi.listConversations()
    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer user-jwt')
  })
})
