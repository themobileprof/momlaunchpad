import { BABY_GENDER_OPTIONS, type BabyGender } from '../lib/babyTheme'

export function GenderPicker({
  value,
  onChange,
}: {
  value: BabyGender | null
  onChange: (gender: BabyGender) => void
}) {
  return (
    <div className="gender-picker" role="group" aria-label="Baby gender">
      {BABY_GENDER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`gender-picker__option gender-picker__option--${opt.value}${
            value === opt.value ? ' gender-picker__option--selected' : ''
          }`}
          onClick={() => onChange(opt.value)}
        >
          <span className="gender-picker__emoji" aria-hidden>
            {opt.emoji}
          </span>
          <span className="gender-picker__label">{opt.label}</span>
          <span className="gender-picker__hint">{opt.hint}</span>
        </button>
      ))}
    </div>
  )
}
