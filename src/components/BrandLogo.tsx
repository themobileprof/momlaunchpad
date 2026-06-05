type Size = 'sm' | 'md' | 'lg'

const SIZES: Record<Size, number> = {
  sm: 32,
  md: 40,
  lg: 48,
}

type Props = {
  size?: Size
  showText?: boolean
  title?: string
  subtitle?: string
  href?: string
  className?: string
}

export function BrandLogo({
  size = 'md',
  showText = true,
  title = 'MomLaunchpad',
  subtitle,
  href,
  className = '',
}: Props) {
  const px = SIZES[size]
  const content = (
    <>
      <img
        src="/logo.png"
        alt=""
        className="brand-logo-img"
        width={px}
        height={px}
        aria-hidden
      />
      {showText && (
        <span className="brand-logo-text">
          <strong>{title}</strong>
          {subtitle && <small>{subtitle}</small>}
        </span>
      )}
    </>
  )

  const classes = `brand-logo brand-logo--${size} ${className}`.trim()

  if (href) {
    return (
      <a href={href} className={classes} aria-label={`${title} home`}>
        {content}
      </a>
    )
  }

  return <div className={classes}>{content}</div>
}
