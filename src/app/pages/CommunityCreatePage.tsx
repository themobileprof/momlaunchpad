import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { PostImagePicker, type PendingImage } from '../components/PostImagePicker'
import { GradientButton, MomAppBar } from '../components/ui'
import { appPath } from '../routes'

export function CommunityCreatePage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'post' | 'event'>('post')
  const [body, setBody] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [images, setImages] = useState<PendingImage[]>([])
  const [eventTitle, setEventTitle] = useState('')
  const [eventType, setEventType] = useState('')
  const [venue, setVenue] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [eventTypes, setEventTypes] = useState<{ key: string; label: string }[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  useEffect(() => {
    userApi.getEventTypes().then((r) => setEventTypes(r.event_types))
  }, [])

  async function submit() {
    if (!body.trim()) {
      setError('Please write something to share')
      return
    }
    setLoading(true)
    setError('')
    setUploadProgress('')
    try {
      const imageUrls: string[] = []
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(`Uploading image ${i + 1} of ${images.length}…`)
        const { url } = await userApi.uploadCommunityImage(images[i].file)
        imageUrls.push(url)
      }

      const payload: Parameters<typeof userApi.createPost>[0] = {
        body: body.trim(),
        is_anonymous: isAnonymous,
        ...(imageUrls.length > 0 ? { image_urls: imageUrls } : {}),
      }
      if (mode === 'event') {
        if (!eventTitle.trim() || !startsAt || !eventType) {
          setError('Complete all event fields')
          setLoading(false)
          return
        }
        payload.event = {
          event_type: eventType,
          title: eventTitle.trim(),
          venue: venue.trim() || undefined,
          starts_at: new Date(startsAt).toISOString(),
        }
      }
      const post = await userApi.createPost(payload)
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
      navigate(appPath(`community/post/${post.id}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create post')
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  return (
    <div className="user-app-content--no-nav">
      <MomAppBar pageTitle="Create" onBack={() => navigate(appPath('community'))} />
      <div style={{ padding: 16 }}>
        <div className="filter-bar" style={{ padding: 0, marginBottom: 16 }}>
          <button type="button" className={`filter-chip${mode === 'post' ? ' filter-chip--active' : ''}`} onClick={() => setMode('post')}>Discussion</button>
          <button type="button" className={`filter-chip${mode === 'event' ? ' filter-chip--active' : ''}`} onClick={() => setMode('event')}>Local event</button>
        </div>

        {error && <div className="u-alert u-alert--error">{error}</div>}
        {uploadProgress && <p className="u-muted" style={{ marginBottom: 12 }}>{uploadProgress}</p>}

        <textarea
          className="app-input"
          rows={5}
          placeholder="What's on your mind?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
          Post anonymously
        </label>

        <div style={{ marginBottom: 16 }}>
          <PostImagePicker images={images} onChange={setImages} disabled={loading} />
        </div>

        {mode === 'event' && (
          <>
            <input className="app-input" placeholder="Event title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} style={{ marginBottom: 8 }} />
            <select className="app-input" value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ marginBottom: 8 }}>
              <option value="">Event type</option>
              {eventTypes.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <input className="app-input" placeholder="Venue (optional)" value={venue} onChange={(e) => setVenue(e.target.value)} style={{ marginBottom: 8 }} />
            <input className="app-input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={{ marginBottom: 12 }} />
          </>
        )}

        <GradientButton onClick={submit} disabled={loading}>
          {loading ? (uploadProgress || 'Posting…') : 'Share with community →'}
        </GradientButton>
      </div>
    </div>
  )
}
