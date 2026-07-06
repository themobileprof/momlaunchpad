import { useRef, useState } from 'react'
import { validateImageFile, MAX_POST_IMAGES } from '../lib/mediaUrl'

export interface PendingImage {
  id: string
  file: File
  previewUrl: string
}

interface PostImagePickerProps {
  images: PendingImage[]
  onChange: (images: PendingImage[]) => void
  disabled?: boolean
}

export function PostImagePicker({ images, onChange, disabled }: PostImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    setError('')
    const next = [...images]
    for (const file of Array.from(fileList)) {
      if (next.length >= MAX_POST_IMAGES) {
        setError(`You can add up to ${MAX_POST_IMAGES} images`)
        break
      }
      const validationError = validateImageFile(file)
      if (validationError) {
        setError(validationError)
        continue
      }
      next.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })
    }
    onChange(next)
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeImage(id: string) {
    const removed = images.find((img) => img.id === id)
    if (removed) URL.revokeObjectURL(removed.previewUrl)
    onChange(images.filter((img) => img.id !== id))
  }

  return (
    <div className="post-image-picker">
      <div className="post-image-picker-header">
        <span className="app-label" style={{ margin: 0 }}>Photos</span>
        <span className="u-muted" style={{ fontSize: '0.82rem' }}>
          {images.length}/{MAX_POST_IMAGES}
        </span>
      </div>

      {error && <p className="post-image-picker-error">{error}</p>}

      <div className="post-image-grid">
        {images.map((img) => (
          <div key={img.id} className="post-image-thumb">
            <img src={img.previewUrl} alt="" />
            <button
              type="button"
              className="post-image-remove"
              onClick={() => removeImage(img.id)}
              disabled={disabled}
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ))}
        {images.length < MAX_POST_IMAGES && (
          <button
            type="button"
            className="post-image-add"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            <span aria-hidden>+</span>
            <span>Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => addFiles(e.target.files)}
      />
    </div>
  )
}
