import { isTestUser } from '../lib/testUser'
import type { AdminUserSummary } from '../api/types'

type Props = {
  user: Pick<AdminUserSummary, 'email' | 'is_admin' | 'is_test_user'>
  className?: string
}

/** Admin / test labels shown next to user identity in lists and pickers. */
export function UserRoleBadges({ user, className = '' }: Props) {
  const test = isTestUser(user)
  if (!user.is_admin && !test) return null
  return (
    <span className={`user-role-badges ${className}`.trim()}>
      {test && <span className="badge badge-test">Test</span>}
      {user.is_admin && <span className="badge badge-muted">Admin</span>}
    </span>
  )
}
