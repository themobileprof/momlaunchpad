import { clampPregnancyWeek, getPregnancyWeekEntry } from './pregnancyTimeline'

const FOETUS_IMAGE_BASE = '/pregnant/foetus'

/** Curated month images in public/pregnant/foetus/month1.jpg … month9.jpg */
export function pregnancyFoetusImageUrl(week: number): string {
  const entry = getPregnancyWeekEntry(week)
  const month = Math.min(9, Math.max(1, entry.gestationalMonth))
  return `${FOETUS_IMAGE_BASE}/month${month}.jpg`
}

export function pregnancyFoetusImageAlt(week: number): string {
  const w = clampPregnancyWeek(week)
  const month = getPregnancyWeekEntry(w).gestationalMonth
  return `Month ${month} fetal development illustration`
}
