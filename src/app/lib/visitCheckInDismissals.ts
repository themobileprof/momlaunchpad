const DISMISSED_KEYS = 'visit_check_in_dismissed_keys'
const MONTHLY_DISMISSED = 'visit_check_in_monthly_dismissed_at'

export function loadDismissedKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEYS)
    if (!raw) return new Set()
    const list = JSON.parse(raw) as string[]
    return new Set(list)
  } catch {
    return new Set()
  }
}

export function saveDismissedKey(key: string) {
  const keys = loadDismissedKeys()
  keys.add(key)
  localStorage.setItem(DISMISSED_KEYS, JSON.stringify([...keys]))
}

export function loadMonthlyDismissedAt(): Date | null {
  const raw = localStorage.getItem(MONTHLY_DISMISSED)
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export function saveMonthlyDismissedAt() {
  localStorage.setItem(MONTHLY_DISMISSED, new Date().toISOString())
}
