import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ApkInstallContent } from './components/ApkInstallContent'
import { AuthProvider, useAuth } from './context/AuthContext'
import { setToken } from './api/client'

function mockFetch(json: unknown, ok = true, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: 'Error',
    json: async () => json,
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('external links (reverse-tabnabbing protection)', () => {
  it('every target="_blank" link also sets rel="noopener noreferrer"', () => {
    const { container } = render(<ApkInstallContent />)
    const blankLinks = container.querySelectorAll('a[target="_blank"]')
    expect(blankLinks.length).toBeGreaterThan(0)
    blankLinks.forEach((a) => {
      const rel = a.getAttribute('rel') ?? ''
      expect(rel).toContain('noopener')
      expect(rel).toContain('noreferrer')
    })
  })
})

describe('admin privilege enforcement', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

  afterEach(() => setToken(null))

  it('rejects a successful login for a non-admin account and stores no token', async () => {
    mockFetch({ token: 'stolen', user: { id: '1', email: 'x@y.z', is_admin: false } })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => {
        await result.current.login('x@y.z', 'pw')
      }),
    ).rejects.toThrow(/admin access/i)

    expect(localStorage.getItem('admin_token')).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('accepts an admin account and persists the token', async () => {
    mockFetch({ token: 'admin-jwt', user: { id: '1', email: 'a@b.c', is_admin: true } })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.login('a@b.c', 'pw')
    })

    expect(localStorage.getItem('admin_token')).toBe('admin-jwt')
    expect(result.current.user?.is_admin).toBe(true)
  })

  it('discards a stored token if /me reports a non-admin account', async () => {
    localStorage.setItem('admin_token', 'tampered')
    mockFetch({ id: '1', email: 'x@y.z', is_admin: false })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('admin_token')).toBeNull()
  })
})
