import { describe, expect, it } from 'vitest'
import { COMPANY_NAME, isIGetBelleHostname, resolveSiteBrand } from './brand'

describe('site brand', () => {
  it('detects igetbelle hosts', () => {
    expect(isIGetBelleHostname('igetbelle.com')).toBe(true)
    expect(isIGetBelleHostname('www.igetbelle.com')).toBe(true)
    expect(isIGetBelleHostname('app.igetbelle.com')).toBe(true)
    expect(isIGetBelleHostname('momlaunchpad.com')).toBe(false)
    expect(isIGetBelleHostname('www.momlaunchpad.com')).toBe(false)
    expect(isIGetBelleHostname('localhost')).toBe(false)
  })

  it('resolves IGetBelle chrome on igetbelle.com', () => {
    const brand = resolveSiteBrand('www.igetbelle.com')
    expect(brand.productName).toBe('IGetBelle')
    expect(brand.productNameDisplay).toBe('IGetBelle')
    expect(brand.companyName).toBe(COMPANY_NAME)
    expect(brand.isIGetBelleHost).toBe(true)
    expect(brand.documentTitle).toContain('IGetBelle')
  })

  it('keeps MomLaunchpad chrome on momlaunchpad.com with IGetBelle company', () => {
    const brand = resolveSiteBrand('momlaunchpad.com')
    expect(brand.productName).toBe('MomLaunchpad')
    expect(brand.productNameDisplay).toBe('MomLaunchPad')
    expect(brand.companyName).toBe('IGetBelle Technologies')
    expect(brand.isIGetBelleHost).toBe(false)
  })
})
