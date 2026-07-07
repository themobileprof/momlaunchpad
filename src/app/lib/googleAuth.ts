/** Web OAuth client ID — same value as GOOGLE_WEB_CLIENT_ID on the backend. */
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? ''

export const isGoogleAuthEnabled = GOOGLE_CLIENT_ID.length > 0
