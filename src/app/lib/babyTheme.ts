/** Baby gender drives accent colors across the user app. */
export type BabyGender = 'girl' | 'boy' | 'unknown'

export type BabyThemeId = 'bloom' | BabyGender

export const BABY_GENDER_OPTIONS: {
  value: BabyGender
  label: string
  emoji: string
  hint: string
}[] = [
  { value: 'girl', label: 'Girl', emoji: '💗', hint: 'Soft rose & blush tones' },
  { value: 'boy', label: 'Boy', emoji: '💙', hint: 'Bold ocean blues' },
  { value: 'unknown', label: 'Surprise!', emoji: '✨', hint: 'Golden plum & sparkle' },
]

/** Resolve the CSS `data-baby-theme` attribute from profile gender (or default). */
export function resolveBabyTheme(gender?: string | null): BabyThemeId {
  if (gender === 'girl' || gender === 'boy' || gender === 'unknown') return gender
  return 'bloom'
}

export function babyThemeLabel(theme: BabyThemeId): string {
  switch (theme) {
    case 'girl':
      return 'Girl'
    case 'boy':
      return 'Boy'
    case 'unknown':
      return 'Surprise'
    default:
      return 'Your journey'
  }
}
