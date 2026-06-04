/** Obscure ops sign-in — not linked from the public site. Override via VITE_ADMIN_SIGN_IN_PATH. */
export const ADMIN_SIGN_IN_PATH =
  import.meta.env.VITE_ADMIN_SIGN_IN_PATH ?? '/access/venue'

export const ADMIN_BASE = '/console'
