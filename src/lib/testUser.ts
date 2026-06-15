/** Demo / seeded accounts use @momlaunchpad.com (matches backend is_test_user). */
export function isTestUser(user: { email?: string; is_test_user?: boolean }): boolean {
  if (user.is_test_user != null) return user.is_test_user
  const email = user.email?.trim().toLowerCase() ?? ''
  return email.endsWith('@momlaunchpad.com')
}
