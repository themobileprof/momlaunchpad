import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { applyDocumentTitle, resolveSiteBrand, type SiteBrand } from '../lib/brand'

const BrandContext = createContext<SiteBrand>(resolveSiteBrand())

export function BrandProvider({ children }: { children: ReactNode }) {
  const brand = useMemo(() => resolveSiteBrand(), [])

  useEffect(() => {
    applyDocumentTitle(brand)
  }, [brand])

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
}

export function useBrand(): SiteBrand {
  return useContext(BrandContext)
}
