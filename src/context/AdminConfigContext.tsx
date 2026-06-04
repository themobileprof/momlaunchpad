import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../api/client'
import type { AdminConfig } from '../api/types'
import { useAuth } from './AuthContext'

interface AdminConfigContextValue {
  config: AdminConfig | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const AdminConfigContext = createContext<AdminConfigContextValue | null>(null)

export function AdminConfigProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user) {
      setConfig(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.getAdminConfig()
      setConfig(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load config')
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  const value = useMemo(
    () => ({ config, loading, error, reload }),
    [config, loading, error, reload],
  )

  return (
    <AdminConfigContext.Provider value={value}>{children}</AdminConfigContext.Provider>
  )
}

export function useAdminConfig() {
  const ctx = useContext(AdminConfigContext)
  if (!ctx) throw new Error('useAdminConfig must be used within AdminConfigProvider')
  return ctx
}
