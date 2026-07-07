import { useState } from 'react'
import { ApkDownloadButton } from './ApkDownloadButton'
import { ApkInstallModal } from './ApkInstallModal'

type Props = {
  className?: string
}

export function ApkDownloadSection({ className = '' }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <section className={`home-android ${className}`.trim()} aria-labelledby="android-heading">
      <h2 id="android-heading" className="home-android-title">
        Android app
      </h2>
      <p className="home-android-lead">
        Install on your phone for the full experience. Early access—not on Google Play yet.
      </p>
      <ApkDownloadButton showInstallHelp={false} showTrustLine={false} />
      <button
        type="button"
        className="home-android-help-link"
        onClick={() => setModalOpen(true)}
      >
        Download and installation
      </button>
      <ApkInstallModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  )
}
