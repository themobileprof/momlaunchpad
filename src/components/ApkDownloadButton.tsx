import { useEffect, useState } from 'react'
import { fetchLatestApkRelease, type ApkReleaseInfo } from '../lib/githubRelease'

type Props = {
  className?: string
  size?: 'default' | 'lg'
}

export function ApkDownloadButton({ className = '', size = 'default' }: Props) {
  const [release, setRelease] = useState<ApkReleaseInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchLatestApkRelease()
      .then((info) => {
        if (!cancelled) setRelease(info)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Download unavailable')
          setRelease(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const sizeClass = size === 'lg' ? 'home-btn-lg' : ''

  if (loading) {
    return (
      <span className={`home-btn home-btn-ghost ${sizeClass} ${className}`.trim()} aria-busy="true">
        Checking for Android build…
      </span>
    )
  }

  if (error) {
    return (
      <p className={`home-apk-error ${className}`.trim()} role="status">
        {error}
      </p>
    )
  }

  if (!release) {
    return (
      <p className={`home-apk-muted ${className}`.trim()} role="status">
        No Android build published yet.
      </p>
    )
  }

  return (
    <div className={`home-apk-download ${className}`.trim()}>
      <a
        className={`home-btn home-btn-primary ${sizeClass}`.trim()}
        href={release.downloadUrl}
        download={release.name}
        rel="noopener noreferrer"
      >
        Download Android app
      </a>
      <p className="home-apk-meta">
        {release.name} · {release.tag}
      </p>
    </div>
  )
}
