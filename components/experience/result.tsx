'use client'

import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import { ArrowLeft, Check, Download, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BuilderProfile } from '@/lib/builder'
import { canShareFileNatively, shareCaption, shareUrl, xIntentUrl } from '@/lib/share'
import { Passport } from './passport'

const ease = [0.22, 1, 0.36, 1] as const

/** Entrance animations finish around 1.7s; capture after they settle. */
const PREWARM_DELAY_MS = 1900

type Rendered = { dataUrl: string; file: File }

export function ResultScreen({
  profile,
  onRestart,
}: {
  profile: BuilderProfile
  onRestart: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // The finished PNG, rendered ahead of time so Download and Share are
  // instant when the user actually clicks.
  const rendered = useRef<Rendered | null>(null)
  const inFlight = useRef<Promise<Rendered | null> | null>(null)
  const alive = useRef(true)

  const fileName = `${profile.builderId}-hh-goa-passport.png`

  // Everything the share needs is derived synchronously from the profile, so
  // the anchor below always has a real href at click time. That matters: a
  // genuine <a target="_blank"> click opens X immediately and is essentially
  // never caught by a popup blocker, unlike a window.open() fired from an
  // async callback after an await.
  const { caption, cardUrl, tweetUrl } = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const text = shareCaption(profile)
    const url = shareUrl(origin, profile)
    return { caption: text, cardUrl: url, tweetUrl: xIntentUrl(text, url) }
  }, [profile])

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 350)
    return () => clearTimeout(t)
  }, [])

  const flash = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 4000)
  }, [])

  /** Renders the card to a PNG once and memoizes it. Safe to call repeatedly. */
  const render = useCallback(async (): Promise<Rendered | null> => {
    if (rendered.current) return rendered.current
    if (inFlight.current) return inFlight.current

    const node = cardRef.current
    if (!node) return null

    inFlight.current = (async () => {
      try {
        const dataUrl = await toPng(node, {
          pixelRatio: 3,
          cacheBust: true,
          backgroundColor: undefined,
        })
        const blob = await (await fetch(dataUrl)).blob()
        const result: Rendered = {
          dataUrl,
          file: new File([blob], fileName, { type: 'image/png' }),
        }
        rendered.current = result
        return result
      } catch (e) {
        console.error('[passport] export failed', e)
        return null
      } finally {
        inFlight.current = null
      }
    })()

    return inFlight.current
  }, [fileName])

  // Warm the export in the background. By the time anyone taps Download or
  // Share, the file already exists — no spinner, no fake "optimizing" steps.
  useEffect(() => {
    alive.current = true
    const t = setTimeout(() => {
      void render()
    }, PREWARM_DELAY_MS)
    return () => {
      alive.current = false
      clearTimeout(t)
    }
  }, [render])

  const saveToDisk = useCallback(
    (result: Rendered) => {
      const link = document.createElement('a')
      link.download = fileName
      link.href = result.dataUrl
      link.click()
    },
    [fileName],
  )

  const handleDownload = useCallback(async () => {
    if (flipped) setFlipped(false)
    const ready = rendered.current
    if (ready) {
      saveToDisk(ready)
    } else {
      setBusy(true)
      const result = await render()
      if (!alive.current) return
      setBusy(false)
      if (!result) {
        flash('Could not create the image. Try again.')
        return
      }
      saveToDisk(result)
    }

    setDone(true)
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f5c445', '#ff4d8d', '#2fd0a0', '#f4ecd8'],
    })
    setTimeout(() => alive.current && setDone(false), 2200)
  }, [flash, flipped, render, saveToDisk])

  /**
   * Two paths, decided synchronously so nothing ever delays the share:
   *
   * 1. Phones (and any browser that can share files) get the real PNG attached
   *    to a native share sheet — pick X and the image is already in the post.
   * 2. Everywhere else the anchor's own navigation opens X's composer with the
   *    caption pre-filled and the card link, whose OG image is this passport.
   *    The PNG is saved alongside so it can be attached manually too.
   */
  const handleShare = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const ready = rendered.current

    if (ready && canShareFileNatively(ready.file)) {
      e.preventDefault()
      navigator
        .share({ text: `${caption}\n\n${cardUrl}`, files: [ready.file] })
        .catch((err: unknown) => {
          // The user dismissing the sheet is not a failure — don't hijack it.
          if (err instanceof Error && err.name === 'AbortError') return
          window.open(tweetUrl, '_blank', 'noopener,noreferrer')
        })
      return
    }

    // Not prevented: X opens in a new tab right now. The download runs in this
    // tab in parallel so the composer can have the image dropped into it.
    void (async () => {
      const result = rendered.current ?? (await render())
      if (!result || !alive.current) return
      saveToDisk(result)
      flash('X is open with your caption. The PNG was saved so you can attach it too.')
    })()
  }

  return (
    <motion.div
      key="result"
      className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4 py-14 sm:px-6 sm:py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease }}
    >
      <button
        onClick={onRestart}
        className="absolute left-4 top-5 inline-flex items-center gap-1.5 text-sm text-sand/70 transition-colors hover:text-sand sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" /> New passport
      </button>

      <motion.p
        className="mb-8 text-center font-display text-sm uppercase tracking-[0.3em] text-gold/90"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease }}
      >
        You&apos;re officially in
      </motion.p>

      {/* card rises from below */}
      <motion.div
        initial={{ opacity: 0, y: 160, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.1, ease, delay: 0.15 }}
      >
        <Passport
          ref={cardRef}
          profile={profile}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          revealed={revealed}
        />
      </motion.div>

      {/* actions */}
      <motion.div
        className="mt-8 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8, ease }}
      >
        <button
          onClick={handleDownload}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 font-medium text-accent-foreground transition-transform duration-300 enabled:hover:scale-[1.03] enabled:active:scale-95 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : done ? (
            <Check className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {busy ? 'Preparing…' : done ? 'Saved' : 'Download'}
        </button>

        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleShare}
          className="glass inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 font-medium text-sand transition-colors duration-300 hover:bg-secondary"
        >
          <XMark className="h-4 w-4" />
          Share to X
        </a>
      </motion.div>

      <p className="mt-3 text-center text-xs text-sand/50">
        Opens X with your caption and #FrameInGoa ready to post.
      </p>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="glass fixed inset-x-4 bottom-6 z-50 mx-auto max-w-md rounded-2xl border border-border px-4 py-3 text-center text-sm text-sand shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
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
