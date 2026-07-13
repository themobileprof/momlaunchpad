import { clampPregnancyWeek } from '../lib/pregnancyTimeline'

/** Visual growth factor 0–1 from gestational week (design-time, not clinical imaging). */
export function fetusVisualScale(week: number): number {
  const w = clampPregnancyWeek(week)
  return 0.12 + ((w - 4) / 36) * 0.88
}

/** Built-in SVG when generated assets are not present. */
export function PregnancyWeekIllustrationFallback({ week }: { week: number }) {
  const scale = fetusVisualScale(week)
  const w = clampPregnancyWeek(week)
  const showLimbs = w >= 8
  const showFace = w >= 14
  const curled = w < 28

  return (
    <div className="pregnancy-week-illustration" aria-hidden>
      <svg viewBox="0 0 200 220" role="img" aria-label={`Week ${w} development illustration`}>
        <defs>
          <linearGradient id="womb-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-soft)" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--accent-light) 40%, var(--surface))" />
          </linearGradient>
        </defs>
        <path
          d="M100 24 C62 24 38 58 38 98 C38 142 62 196 100 204 C138 196 162 142 162 98 C162 58 138 24 100 24 Z"
          fill="url(#womb-fill)"
          stroke="color-mix(in srgb, var(--accent-deep) 35%, transparent)"
          strokeWidth="2"
        />
        <ellipse cx="100" cy="112" rx="52" ry="62" fill="color-mix(in srgb, white 55%, transparent)" />
        <g transform={`translate(100, ${curled ? 118 : 108}) scale(${scale})`}>
          {curled ? (
            <>
              <ellipse cx="0" cy="8" rx="14" ry="11" fill="none" stroke="var(--accent-deep)" strokeWidth="2" />
              <path
                d="M-6 14 Q0 28 14 16 Q8 34 0 26 Q-10 34 -6 14"
                fill="none"
                stroke="var(--accent-deep)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {showLimbs && (
                <>
                  <path d="M-12 10 Q-20 4 -16 14" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 10 Q20 4 16 14" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
              {showFace && (
                <>
                  <circle cx="-4" cy="6" r="1.2" fill="var(--accent-deep)" />
                  <circle cx="4" cy="6" r="1.2" fill="var(--accent-deep)" />
                </>
              )}
            </>
          ) : (
            <>
              <circle cx="0" cy="-12" r="11" fill="none" stroke="var(--accent-deep)" strokeWidth="2" />
              <path
                d="M-10 -2 L-12 22 L12 22 L10 -2"
                fill="none"
                stroke="var(--accent-deep)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path d="M-12 22 L-14 34 M12 22 L14 34" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
              {showFace && (
                <>
                  <circle cx="-4" cy="-14" r="1.2" fill="var(--accent-deep)" />
                  <circle cx="4" cy="-14" r="1.2" fill="var(--accent-deep)" />
                </>
              )}
            </>
          )}
        </g>
        <text x="100" y="212" textAnchor="middle" className="pregnancy-week-illustration__label">
          Week {w}
        </text>
      </svg>
    </div>
  )
}
