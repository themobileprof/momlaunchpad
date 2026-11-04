import type { ConditionClass, Symptom } from '../types'

const fleetingTypes = new Set([
  'cold',
  'cough',
  'fever',
  'sore_throat',
  'fatigue',
  'insomnia',
  'mood_changes',
])

const commonTypes = new Set([
  'nausea',
  'vomiting',
  'heartburn',
  'constipation',
  'back_pain',
  'cramping',
  'breast_changes',
  'frequent_urination',
  'dizziness',
  'headache',
  'swelling',
])

const watchTypes = new Set([
  'malaria',
  'bleeding',
  'vision_changes',
  'contractions',
  'shortness_breath',
  'preeclampsia_signs',
])

const recurrenceWindowMs = 28 * 86400000
const recurrenceThreshold = 2
const fleetingRecentMs = 7 * 86400000
const commonRecentMs = 14 * 86400000
const watchRecentMs = 90 * 86400000

export function classifySymptomType(type: string): ConditionClass {
  const key = type.trim().toLowerCase()
  if (watchTypes.has(key)) return 'watch'
  if (commonTypes.has(key)) return 'common'
  if (fleetingTypes.has(key)) return 'fleeting'
  return 'fleeting'
}

export function parseConditionClass(
  raw: string | undefined | null,
  symptomType?: string,
): ConditionClass {
  switch ((raw ?? '').trim().toLowerCase()) {
    case 'watch':
      return 'watch'
    case 'common':
      return 'common'
    case 'standing':
      return 'standing'
    case 'fleeting':
      return 'fleeting'
    default:
      return classifySymptomType(symptomType ?? '')
  }
}

export function conditionClassLabel(c: ConditionClass): string {
  switch (c) {
    case 'fleeting':
      return 'Fleeting'
    case 'common':
      return 'Common'
    case 'watch':
      return 'Watch'
    case 'standing':
      return 'Standing'
  }
}

export function symptomTypeLabel(type: string): string {
  return type
    .split('_')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function symptomDisplayText(s: Symptom): string {
  const summary = s.summary?.trim()
  if (summary) return summary
  return s.description
}

function isRelevantForCheckIn(
  symptom: Symptom,
  cls: ConditionClass,
  recurrenceCount: number,
  now: Date,
): boolean {
  const age = now.getTime() - new Date(symptom.reported_at).getTime()
  const recurrent = symptom.is_recurrent === true || recurrenceCount >= recurrenceThreshold

  switch (cls) {
    case 'watch':
      return age <= watchRecentMs
    case 'common':
      return age <= commonRecentMs || recurrent
    case 'standing':
      return true
    case 'fleeting':
      return age <= fleetingRecentMs || recurrent
  }
}

/** Pick ongoing symptoms worth surfacing on Home (mirrors mobile). */
export function selectRelevantSymptoms(
  raw: Symptom[],
  options: { now?: Date; max?: number } = {},
): Symptom[] {
  const now = options.now ?? new Date()
  const max = options.max ?? 5
  const counts: Record<string, number> = {}

  for (const s of raw) {
    if (now.getTime() - new Date(s.reported_at).getTime() <= recurrenceWindowMs) {
      counts[s.symptom_type] = (counts[s.symptom_type] ?? 0) + 1
    }
  }

  const seen = new Set<string>()
  const kept: Symptom[] = []

  for (const s of raw) {
    if (s.is_resolved) continue
    const count = counts[s.symptom_type] ?? 1
    const cls = parseConditionClass(s.condition_class, s.symptom_type)
    const annotated: Symptom = {
      ...s,
      condition_class: cls,
      recurrence_count: s.recurrence_count ?? count,
      is_recurrent: s.is_recurrent === true || count >= recurrenceThreshold,
    }
    if (!isRelevantForCheckIn(annotated, cls, count, now)) continue
    if (cls !== 'watch' && seen.has(annotated.symptom_type)) continue
    seen.add(annotated.symptom_type)
    kept.push(annotated)
  }

  kept.sort((a, b) => {
    const aWatch = a.condition_class === 'watch'
    const bWatch = b.condition_class === 'watch'
    if (aWatch !== bWatch) return aWatch ? -1 : 1
    return new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
  })

  return kept.slice(0, max)
}
