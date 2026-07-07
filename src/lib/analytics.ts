// Google Analytics 4 (gtag.js) for the web SPA.
//
// The measurement ID comes from VITE_GA_MEASUREMENT_ID (falls back to the
// project's property so it works out of the box). Analytics only run in
// production builds, so local `npm run dev` never pollutes the GA property.
//
// Because this is a single-page app, gtag's automatic page_view only fires on
// the initial hard load. We disable that (send_page_view: false) and emit
// page_view manually on every React Router navigation instead.

const GA_MEASUREMENT_ID = (
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || 'G-4C2P6EZ1LQ'
).trim()

export const isAnalyticsEnabled = GA_MEASUREMENT_ID.length > 0 && import.meta.env.PROD

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

let initialized = false

/** Injects gtag.js and configures the property. Safe to call more than once. */
export function initAnalytics(): void {
  if (!isAnalyticsEnabled || initialized || typeof document === 'undefined') return
  initialized = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args)
  }
  window.gtag('js', new Date())
  // Manual page_view on route changes gives accurate SPA navigation counts.
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })
}

/** Sends a page_view for the current SPA route. */
export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsEnabled || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
  })
}

/** Sends a custom GA4 event. */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', name, params)
}
