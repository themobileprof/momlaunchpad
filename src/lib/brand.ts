/** Host-aware product chrome. Legal entity is always IGetBelle Technologies. */

export const COMPANY_NAME = 'IGetBelle Technologies'

export type SiteBrand = {
  /** Consumer-facing product name in sentences */
  productName: string
  /** Compact app-bar / logo wordmark */
  productNameDisplay: string
  /** Legal copyright entity */
  companyName: string
  documentTitle: string
  isIGetBelleHost: boolean
}

const IGETBELLE: SiteBrand = {
  productName: 'IGetBelle',
  productNameDisplay: 'IGetBelle',
  companyName: COMPANY_NAME,
  documentTitle: 'IGetBelle — Pregnancy support, reimagined',
  isIGetBelleHost: true,
}

const MOMLAUNCHPAD: SiteBrand = {
  productName: 'MomLaunchpad',
  productNameDisplay: 'MomLaunchPad',
  companyName: COMPANY_NAME,
  documentTitle: 'MomLaunchpad — Pregnancy support, reimagined',
  isIGetBelleHost: false,
}

/** True for igetbelle.com and www.igetbelle.com (and subdomains). */
export function isIGetBelleHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '')
  return host === 'igetbelle.com' || host.endsWith('.igetbelle.com')
}

export function resolveSiteBrand(
  hostname: string = typeof window !== 'undefined' ? window.location.hostname : '',
): SiteBrand {
  return isIGetBelleHostname(hostname) ? IGETBELLE : MOMLAUNCHPAD
}

export function applyDocumentTitle(brand: SiteBrand = resolveSiteBrand()): void {
  if (typeof document === 'undefined') return
  document.title = brand.documentTitle
}
