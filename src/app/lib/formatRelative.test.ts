import { describe, expect, it } from 'vitest'
import { formatRelative } from './formatRelative'

describe('formatRelative', () => {
  it('labels today and yesterday', () => {
    const today = new Date()
    expect(formatRelative(today.toISOString())).toBe('Today')

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(formatRelative(yesterday.toISOString())).toBe('Yesterday')
  })

  it('returns empty string for invalid dates', () => {
    expect(formatRelative('not-a-date')).toBe('')
  })
})
