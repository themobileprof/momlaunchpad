import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  clampPregnancyWeek,
  getPregnancyWeekEntry,
  monthLabel,
  PREGNANCY_WEEK_MAX,
  PREGNANCY_WEEK_MIN,
  trimesterLabel,
} from '../lib/pregnancyTimeline'
import { PregnancyWeekIllustration } from './PregnancyWeekIllustration'
import { appPath } from '../routes'

export function PregnancyWeekStory({ profileWeek }: { profileWeek?: number }) {
  const currentWeek = profileWeek != null ? clampPregnancyWeek(profileWeek) : null
  const [viewWeek, setViewWeek] = useState(currentWeek ?? 20)

  useEffect(() => {
    if (currentWeek != null) setViewWeek(currentWeek)
  }, [currentWeek])

  const entry = getPregnancyWeekEntry(viewWeek)
  const isCurrent = currentWeek != null && viewWeek === currentWeek

  return (
    <section className="pregnancy-week-story" aria-labelledby="pregnancy-week-title">
      <div className="pregnancy-week-story__nav">
        <button
          type="button"
          className="app-btn app-btn--ghost app-btn--sm"
          disabled={viewWeek <= PREGNANCY_WEEK_MIN}
          onClick={() => setViewWeek((w) => Math.max(PREGNANCY_WEEK_MIN, w - 1))}
          aria-label="Previous week"
        >
          ‹
        </button>
        <div className="pregnancy-week-story__nav-center">
          <p className="u-caption">Pregnancy journey</p>
          <h2 id="pregnancy-week-title" className="pregnancy-week-story__title">
            Week {entry.week}
            {isCurrent && <span className="pregnancy-week-story__you"> · You are here</span>}
          </h2>
        </div>
        <button
          type="button"
          className="app-btn app-btn--ghost app-btn--sm"
          disabled={viewWeek >= PREGNANCY_WEEK_MAX}
          onClick={() => setViewWeek((w) => Math.min(PREGNANCY_WEEK_MAX, w + 1))}
          aria-label="Next week"
        >
          ›
        </button>
      </div>

      <div className="pregnancy-week-story__badges">
        <span className="app-badge">{trimesterLabel(entry.trimester)}</span>
        <span className="app-badge">{monthLabel(entry.gestationalMonth)}</span>
        <span className="app-badge">About the size of a {entry.babySizeLabel.toLowerCase()}</span>
      </div>

      <p className="pregnancy-week-story__headline">{entry.headline}</p>

      <PregnancyWeekIllustration week={entry.week} />

      <div className="pregnancy-week-story__columns">
        <article className="pregnancy-week-story__card">
          <h3 className="pregnancy-week-story__card-title">You</h3>
          <p>{entry.momNarrative}</p>
        </article>
        <article className="pregnancy-week-story__card">
          <h3 className="pregnancy-week-story__card-title">Your baby</h3>
          <p>{entry.babyNarrative}</p>
        </article>
      </div>

      {entry.gentleTip && (
        <p className="pregnancy-week-story__tip">
          <strong>Tip:</strong> {entry.gentleTip}
        </p>
      )}

      {!isCurrent && currentWeek != null && (
        <button
          type="button"
          className="app-btn app-btn--outline app-btn--sm pregnancy-week-story__jump"
          onClick={() => setViewWeek(currentWeek)}
        >
          Jump to your week ({currentWeek})
        </button>
      )}

      {currentWeek == null && (
        <p className="pregnancy-week-story__tip">
          Set your pregnancy week in{' '}
          <Link to={appPath('profile')}>profile</Link> to highlight your current chapter.
        </p>
      )}
    </section>
  )
}
