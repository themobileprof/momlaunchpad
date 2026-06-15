import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { captureReferralFromSearchParams } from '../lib/referral'

/** Saves ?ref= from any route before redirects can strip the query string. */
export function ReferralCapture() {
  const [searchParams] = useSearchParams()

  useMemo(() => {
    captureReferralFromSearchParams(searchParams)
  }, [searchParams])

  return null
}
