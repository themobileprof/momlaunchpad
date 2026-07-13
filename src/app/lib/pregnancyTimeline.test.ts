import { describe, expect, it } from 'vitest'
import {
  clampPregnancyWeek,
  getPregnancyWeekEntry,
  PREGNANCY_WEEK_MAX,
  PREGNANCY_WEEK_MIN,
} from './pregnancyTimeline'

describe('pregnancyTimeline', () => {
  it('clamps week to valid range', () => {
    expect(clampPregnancyWeek(1)).toBe(PREGNANCY_WEEK_MIN)
    expect(clampPregnancyWeek(99)).toBe(PREGNANCY_WEEK_MAX)
    expect(clampPregnancyWeek(20)).toBe(20)
  })

  it('returns entry for each week in range', () => {
    for (let w = PREGNANCY_WEEK_MIN; w <= PREGNANCY_WEEK_MAX; w++) {
      const entry = getPregnancyWeekEntry(w)
      expect(entry.week).toBe(w)
      expect(entry.momNarrative.length).toBeGreaterThan(10)
      expect(entry.babyNarrative.length).toBeGreaterThan(10)
    }
  })

  it('week 20 is halfway milestone copy', () => {
    const entry = getPregnancyWeekEntry(20)
    expect(entry.headline).toMatch(/Halfway/i)
  })
})
