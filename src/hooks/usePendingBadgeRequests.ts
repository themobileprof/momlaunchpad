import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'

export function usePendingBadgeRequests() {
  const [count, setCount] = useState(0)

  const reload = useCallback(async () => {
    try {
      const res = await api.listBadgeRequests('pending')
      setCount(res.requests?.length ?? 0)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { count, reload }
}
