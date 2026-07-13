import { useCallback, useState } from 'react'
import { clampPregnancyWeek } from '../lib/pregnancyTimeline'
import {
  pregnancyFoetusImageAlt,
  pregnancyFoetusImageUrl,
} from '../lib/pregnancyWeekAssets'
import { PregnancyWeekIllustrationFallback } from './PregnancyWeekIllustrationFallback'

/** Week illustration from curated images in public/pregnant/foetus/. */
export function PregnancyWeekIllustration({ week }: { week: number }) {
  const w = clampPregnancyWeek(week)
  const [failed, setFailed] = useState(false)
  const handleError = useCallback(() => setFailed(true), [])

  if (failed) {
    return <PregnancyWeekIllustrationFallback week={w} />
  }

  return (
    <div className="pregnancy-week-illustration">
      <img
        src={pregnancyFoetusImageUrl(w)}
        alt={pregnancyFoetusImageAlt(w)}
        onError={handleError}
      />
    </div>
  )
}
