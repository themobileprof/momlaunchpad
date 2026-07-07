export function MoreMenuSheet({
  onClose,
  onProfile,
  onSettings,
  onInbox,
  inboxUnread = 0,
}: {
  onClose: () => void
  onProfile: () => void
  onSettings: () => void
  onInbox: () => void
  inboxUnread?: number
}) {
  return (
    <div className="sheet-overlay" onClick={onClose} role="presentation">
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="More">
        <h2 className="u-heading-sm" style={{ marginBottom: 16 }}>More</h2>
        <button type="button" className="sheet-item" onClick={onInbox}>
          <span className="sheet-item-icon">🎁</span>
          <span>Rewards &amp; updates</span>
          {inboxUnread > 0 && (
            <span className="sheet-item-badge">{inboxUnread > 99 ? '99+' : inboxUnread}</span>
          )}
        </button>
        <button type="button" className="sheet-item" onClick={onProfile}>
          <span className="sheet-item-icon">👤</span>
          <span>Your profile</span>
        </button>
        <button type="button" className="sheet-item" onClick={onSettings}>
          <span className="sheet-item-icon">⚙️</span>
          <span>Settings</span>
        </button>
        <button type="button" className="app-btn app-btn--ghost" style={{ width: '100%', marginTop: 12 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
