'use client'

import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import { ArrowLeft, Download, ImageUp, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { canShareFileNatively, pfpCaption, xIntentUrl } from '@/lib/share'
import { readImageFileSafely } from '@/lib/utils'

const ease = [0.22, 1, 0.36, 1] as const

const FILE_NAME = 'hh-goa-pfp.png'

type Rendered = { dataUrl: string; file: File }

export function PfpGenerator({ onBack }: { onBack: () => void }) {
  const [photo, setPhoto] = useState<string | undefined>()
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Same trick as the passport screen: render the PNG ahead of the click so
  // Download and Share both fire instantly.
  const rendered = useRef<Rendered | null>(null)
  const inFlight = useRef<Promise<Rendered | null> | null>(null)

  const { caption, tweetUrl } = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const text = pfpCaption()
    return { caption: text, tweetUrl: xIntentUrl(text, origin || undefined) }
  }, [])

  const readFile = useCallback((file: File) => {
    setPhotoError(null)
    rendered.current = null
    readImageFileSafely(file)
      .then(setPhoto)
      .catch((e: Error) => setPhotoError(e.message))
  }, [])

  const render = useCallback(async (): Promise<Rendered | null> => {
    if (rendered.current) return rendered.current
    if (inFlight.current) return inFlight.current
    const node = frameRef.current
    if (!node || !photo) return null

    inFlight.current = (async () => {
      try {
        const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true })
        const blob = await (await fetch(dataUrl)).blob()
        const result: Rendered = {
          dataUrl,
          file: new File([blob], FILE_NAME, { type: 'image/png' }),
        }
        rendered.current = result
        return result
      } catch (e) {
        console.error('[pfp] export failed', e)
        return null
      } finally {
        inFlight.current = null
      }
    })()

    return inFlight.current
  }, [photo])

  // Warm the export as soon as a photo lands, so the buttons never wait.
  useEffect(() => {
    if (!photo) return
    const t = setTimeout(() => {
      void render()
    }, 400)
    return () => clearTimeout(t)
  }, [photo, render])

  const saveToDisk = (result: Rendered) => {
    const link = document.createElement('a')
    link.download = FILE_NAME
    link.href = result.dataUrl
    link.click()
  }

  const download = async () => {
    const ready = rendered.current
    let result = ready
    if (!result) {
      setBusy(true)
      result = await render()
      setBusy(false)
    }
    if (!result) return
    saveToDisk(result)
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#f5c445', '#ff4d8d', '#2fd0a0', '#f4ecd8'],
    })
  }

  const handleShare = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const ready = rendered.current

    if (ready && canShareFileNatively(ready.file)) {
      e.preventDefault()
      navigator.share({ text: caption, files: [ready.file] }).catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return
        window.open(tweetUrl, '_blank', 'noopener,noreferrer')
      })
      return
    }

    // X opens now via the anchor; save the PNG so it can be attached there.
    void (async () => {
      const result = rendered.current ?? (await render())
      if (result) saveToDisk(result)
    })()
  }

  return (
    <motion.div
      key="pfp"
      className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
      transition={{ duration: 0.7, ease }}
    >
      <button
        onClick={onBack}
        className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm text-sand/70 transition-colors hover:text-sand"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Goa PFP Frame
      </h2>
      <p className="mt-2 text-sand/70">Frame your avatar. Ready for your X profile.</p>

      {/* Circular framed preview */}
      <div
        ref={frameRef}
        className="relative mt-10 h-64 w-64 overflow-hidden rounded-full"
        style={{
          background:
            'linear-gradient(180deg, oklch(0.35 0.08 300), oklch(0.62 0.15 40) 45%, oklch(0.84 0.16 72) 78%)',
        }}
      >
        {/* photo */}
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo || '/placeholder.svg'}
            alt="Your avatar"
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sand/60">
            <ImageUp className="h-8 w-8" />
          </div>
        )}

        {/* sun glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
          style={{
            background:
              'radial-gradient(circle at 50% 70%, oklch(0.95 0.09 90 / 0.5), transparent 60%)',
          }}
        />

        {/* palm silhouettes */}
        <svg viewBox="0 0 100 200" className="absolute bottom-0 left-1 h-24 w-14" fill="oklch(0.18 0.04 175)">
          <path d="M48 200 C 46 150 45 110 50 82 C 52 110 52 150 52 200 Z" />
          <path d="M50 82 C 32 68 18 71 6 82 C 22 64 40 67 50 82 Z" />
          <path d="M50 82 C 68 68 82 71 94 82 C 78 64 60 67 50 82 Z" />
          <path d="M50 82 C 38 54 30 38 26 24 C 42 50 48 66 50 82 Z" />
        </svg>

        {/* golden ring + label */}
        <div className="pointer-events-none absolute inset-0 rounded-full border-[6px] border-gold/90" />
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <span className="rounded-full bg-black/45 px-2.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur">
            HH Goa 2026
          </span>
        </div>
      </div>

      {/* upload */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files?.[0]
          if (f) readFile(f)
        }}
        className={`glass mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-4 text-sm transition-colors ${
          dragging ? 'border-gold bg-secondary/60' : 'border-border'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/heic,.heic"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
        />
        <ImageUp className="h-4 w-4 text-gold" />
        {photo ? 'Replace photo' : 'Upload or drop your photo'}
      </button>
      {photoError && (
        <p className="mt-2 text-xs text-red-400">{photoError}</p>
      )}

      <div className="mt-4 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={download}
          disabled={!photo || busy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 font-medium text-accent-foreground transition-transform duration-300 enabled:hover:scale-[1.03] enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {busy ? 'Exporting…' : 'Download PFP'}
        </button>

        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleShare}
          aria-disabled={!photo}
          className={`glass inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 font-medium text-sand transition-colors duration-300 hover:bg-secondary ${
            photo ? '' : 'pointer-events-none opacity-40'
          }`}
        >
          <XMark className="h-4 w-4" />
          Share to X
        </a>
      </div>

      <p className="mt-3 text-xs text-sand/50">
        Opens X with your caption and #FrameInGoa ready to post.
      </p>
    </motion.div>
  )
}

function XMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.48 3.24H4.29L17.61 20.65Z" />
    </svg>
  )
}
