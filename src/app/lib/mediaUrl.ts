const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

/** Normalize uploaded image URLs for display (dev proxy + production API host). */
export function resolveMediaUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('/uploads/')) {
    return API_BASE ? `${API_BASE.replace(/\/$/, '')}${url}` : url
  }
  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith('/uploads/') && !API_BASE) {
      return parsed.pathname
    }
  } catch {
    /* ignore */
  }
  return url
}

export const MAX_POST_IMAGES = 4
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose an image file'
  if (file.size > MAX_IMAGE_BYTES) return 'Each image must be 5MB or smaller'
  return null
}
