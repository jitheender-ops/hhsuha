import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Turns arbitrary user input into a safe http(s) URL, or returns undefined.
 * - Rejects dangerous schemes (javascript:, data:, vbscript:, file:, etc.)
 * - Auto-prepends https:// if the user typed a bare domain like "site.com"
 */
export function safeUrl(input?: string): string | undefined {
  if (!input) return undefined
  const trimmed = input.trim()
  if (!trimmed) return undefined

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  const candidate = hasScheme ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

/** Strips anything but safe handle characters, for building github/linkedin URLs. */
export function safeHandle(input?: string): string | undefined {
  if (!input) return undefined
  const cleaned = input.trim().replace(/^@/, '').replace(/^\/+/, '')
  const stripped = cleaned.replace(/[^a-zA-Z0-9-_./]/g, '')
  return stripped || undefined
}

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // 5MB
export const MAX_PHOTO_DIMENSION = 1024 // px, longest side after downscale

/**
 * Reads an image file into a size-capped, downscaled data URL.
 * Rejects files over MAX_PHOTO_BYTES before doing any work, then draws the
 * image onto a canvas capped at MAX_PHOTO_DIMENSION so exports (html-to-image
 * at pixelRatio 3) stay fast on lower-end phones.
 */
export function readImageFileSafely(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') && !/\.heic$/i.test(file.name)) {
      reject(new Error('Unsupported file type'))
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      reject(new Error('Image is larger than 5MB'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.onerror = () => resolve(dataUrl) // fall back to original if decode fails (e.g. HEIC)
      img.onload = () => {
        const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(img.width, img.height))
        if (scale >= 1) {
          resolve(dataUrl)
          return
        }
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(dataUrl)
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  })
}
