import { describe, expect, it } from 'vitest'
import {
  classifySymptomType,
  selectRelevantSymptoms,
  symptomDisplayText,
  symptomTypeLabel,
} from './conditionClass'
import type { Symptom } from '../types'

function symptom(partial: Partial<Symptom> & Pick<Symptom, 'id' | 'symptom_type'>): Symptom {
  return {
    description: 'test',
    severity: 'mild',
    frequency: 'occasional',
    is_resolved: false,
    reported_at: new Date().toISOString(),
    ...partial,
  }
}

describe('conditionClass helpers', () => {
  it('labels symptom types for display', () => {
    expect(symptomTypeLabel('back_pain')).toBe('Back Pain')
  })

  it('prefers summary for display text', () => {
    expect(
      symptomDisplayText(
        symptom({
          id: '1',
          symptom_type: 'nausea',
          description: 'long text',
          summary: 'Morning sickness',
        }),
      ),
    ).toBe('Morning sickness')
  })

  it('classifies malaria as watch and cold as fleeting', () => {
    expect(classifySymptomType('malaria')).toBe('watch')
    expect(classifySymptomType('cold')).toBe('fleeting')
  })

  it('keeps recent ongoing symptoms for check-in and drops resolved', () => {
    const now = new Date('2026-06-01T12:00:00Z')
    const list = selectRelevantSymptoms(
      [
        symptom({
          id: 'a',
          symptom_type: 'nausea',
          reported_at: '2026-05-30T12:00:00Z',
        }),
        symptom({
          id: 'b',
          symptom_type: 'fatigue',
          is_resolved: true,
          reported_at: '2026-05-31T12:00:00Z',
        }),
        symptom({
          id: 'c',
          symptom_type: 'bleeding',
          reported_at: '2026-05-20T12:00:00Z',
        }),
      ],
      { now, max: 5 },
    )
    expect(list.map((s) => s.id)).toEqual(['c', 'a'])
  })
})
