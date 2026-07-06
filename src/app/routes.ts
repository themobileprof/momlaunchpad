export const APP_BASE = '/app'

export const appPath = (sub = '') =>
  sub ? `${APP_BASE}/${sub.replace(/^\//, '')}` : APP_BASE
