import { useEffect } from 'react'
import { ApkInstallContent } from './ApkInstallContent'

type Props = {
  open: boolean
  onClose: () => void
}

export function ApkInstallModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="home-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="home-modal"
        role="dialog"
        aria-labelledby="apk-install-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="home-modal-header">
          <h2 id="apk-install-title">Download &amp; installation</h2>
          <button type="button" className="home-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="home-modal-body">
          <ApkInstallContent />
        </div>
      </div>
    </div>
  )
}
