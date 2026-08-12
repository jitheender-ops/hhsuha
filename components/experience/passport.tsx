'use client'

import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { Globe, MapPin, QrCode, ShieldCheck } from 'lucide-react'
import { forwardRef, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import type { BuilderProfile } from '@/lib/builder'
import { safeHandle, safeUrl } from '@/lib/utils'

const ease = [0.22, 1, 0.36, 1] as const

export type PassportHandle = HTMLDivElement

export const Passport = forwardRef<
  HTMLDivElement,
  { profile: BuilderProfile; flipped: boolean; onFlip: () => void; revealed: boolean }
>(function Passport({ profile, flipped, onFlip, revealed }, exportRef) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [qr, setQr] = useState<string>('')

  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 150, damping: 18 })
  const sry = useSpring(ry, { stiffness: 150, damping: 18 })
  const rotateX = useTransform(srx, (v) => `${v}deg`)
  const rotateY = useTransform(sry, (v) => `${v}deg`)
  const glareX = useTransform(sry, [-12, 12], ['0%', '100%'])

  useEffect(() => {
    const githubHandle = safeHandle(profile.github)
    const url =
      safeUrl(profile.portfolio) ||
      (githubHandle ? `https://github.com/${githubHandle}` : '') ||
      'https://hackerhouse.goa'
    QRCode.toDataURL(url, {
      margin: 1,
      color: { dark: '#062a20', light: '#f4ecd8' },
      width: 240,
    }).then(setQr)
  }, [profile])

  // Desktop pointer tilt
  const handlePointer = (e: React.PointerEvent) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    ry.set(px * 16)
    rx.set(-py * 16)
  }
  const reset = () => {
    rx.set(0)
    ry.set(0)
  }

  // Mobile gyroscope tilt
  useEffect(() => {
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      ry.set(Math.max(-14, Math.min(14, e.gamma * 0.4)))
      rx.set(Math.max(-14, Math.min(14, (e.beta - 45) * 0.3)))
    }
    window.addEventListener('deviceorientation', onOrient)
    return () => window.removeEventListener('deviceorientation', onOrient)
  }, [rx, ry])

  return (
    <div
      ref={wrapRef}
      onPointerMove={handlePointer}
      onPointerLeave={reset}
      className="relative"
      style={{ perspective: 1400 }}
    >
      {/* Tilt layer (pointer / gyro). Width tracks the viewport on narrow
          phones — a hard 350px card overflows a 360px screen — while the
          aspect ratio keeps the card's proportions (and the export) identical. */}
      <motion.div
        className="will-3d relative aspect-[350/560] w-[min(350px,calc(100vw-2.5rem))]"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {/* Flip layer */}
        <motion.div
          className="will-3d absolute inset-0"
          style={{ transformStyle: 'preserve-3d' }}
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.9, ease }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 will-3d"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <CardFront
              ref={exportRef}
              profile={profile}
              qr={qr}
              glareX={glareX}
              revealed={revealed}
            />
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 will-3d"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardBack profile={profile} qr={qr} />
          </div>
        </motion.div>
      </motion.div>

      <button
        onClick={onFlip}
        className="mx-auto mt-6 block rounded-full border border-border px-5 py-2 text-xs font-medium text-sand/80 transition-colors hover:bg-secondary glass"
      >
        {flipped ? 'Show front' : 'Flip to see back'}
      </button>
    </div>
  )
})

const CardFront = forwardRef<
  HTMLDivElement,
  {
    profile: BuilderProfile
    qr: string
    glareX: MotionValue<string>
    revealed: boolean
  }
>(function CardFront({ profile, qr, glareX, revealed }, ref) {
  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/15 shadow-[0_40px_120px_-30px_oklch(0.1_0.03_175/0.9)]"
      style={{
        background:
          'linear-gradient(165deg, oklch(0.3 0.06 168) 0%, oklch(0.22 0.05 172) 55%, oklch(0.17 0.04 178) 100%)',
      }}
    >
      {/* Goa scene inside card */}
      <div className="absolute inset-x-0 top-0 h-[46%] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, oklch(0.35 0.08 300) 0%, oklch(0.6 0.15 35) 45%, oklch(0.82 0.16 70) 80%)',
          }}
        />
        <div
          className="absolute left-1/2 top-[70%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, oklch(0.96 0.09 90), oklch(0.85 0.16 70) 55%, transparent 72%)',
          }}
        />
        {/* ocean strip */}
        <div
          className="absolute inset-x-0 bottom-0 h-8"
          style={{
            background:
              'linear-gradient(180deg, oklch(0.55 0.12 55 / 0.8), oklch(0.3 0.07 180))',
          }}
        />
      </div>

      {/* animated glare */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'linear-gradient(105deg, transparent 30%, oklch(0.98 0.02 90 / 0.35) 48%, transparent 62%)',
          backgroundSize: '250% 100%',
          backgroundPositionX: glareX,
        }}
      />

      {/* header */}
      <div className="relative flex items-center justify-between px-5 pt-4">
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90">
          Hacker House Goa
        </span>
        <span className="rounded-full bg-black/25 px-2 py-0.5 font-mono text-[10px] text-white/85">
          2026
        </span>
      </div>

      {/* avatar */}
      <div className="relative mt-6 flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={revealed ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
          className="h-28 w-28 overflow-hidden rounded-full border-4 border-sand/90 bg-secondary shadow-lg"
        >
          {profile.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photo || '/placeholder.svg'}
              alt={`${profile.name}`}
              crossOrigin="anonymous"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-emerald/30 font-display text-3xl font-bold text-sand">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </motion.div>
      </div>

      {/* identity */}
      <div className="relative mt-4 px-5 text-center">
        <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-white">
          {profile.name}
        </h3>
        <p className="mt-1 bg-gradient-to-r from-gold to-pink bg-clip-text text-sm font-semibold text-transparent">
          {profile.title}
        </p>
        <p className="mt-0.5 text-xs text-white/60">{profile.role}</p>
      </div>

      {/* XP / Level */}
      <div className="relative mx-5 mt-4 flex items-center justify-between rounded-2xl bg-black/25 px-4 py-2.5">
        <Stat label="Builder XP" value={profile.xp.toLocaleString()} />
        <div className="h-8 w-px bg-white/15" />
        <Stat label="Level" value={`${profile.level}`} sub={profile.levelName} />
      </div>

      {/* skills */}
      <div className="relative mt-3 flex flex-wrap justify-center gap-1.5 px-5">
        {profile.skills.map((s) => (
          <span
            key={s}
            className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-white/80"
          >
            {s}
          </span>
        ))}
      </div>

      {/* footer: id + qr + verified */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pb-4">
        <div>
          <p className="font-mono text-[10px] text-white/50">BUILDER ID</p>
          <p className="font-mono text-xs font-semibold text-white/85">
            {profile.builderId}
          </p>
          <p className="mt-1 font-mono text-[10px] text-white/45">{profile.date}</p>
        </div>

        {/* verified stamp */}
        <motion.div
          initial={{ opacity: 0, scale: 1.6, rotate: -18 }}
          animate={revealed ? { opacity: 1, scale: 1, rotate: -10 } : {}}
          transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.7 }}
          className="flex flex-col items-center"
        >
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr || '/placeholder.svg'}
              alt="Builder QR code"
              className="h-14 w-14 rounded-md"
            />
          ) : (
            <QrCode className="h-14 w-14 text-white/40" />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 1.8, rotate: 12 }}
          animate={revealed ? { opacity: 1, scale: 1, rotate: -8 } : {}}
          transition={{ type: 'spring', stiffness: 200, damping: 11, delay: 0.85 }}
          className="flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-gold/80 text-gold"
        >
          <ShieldCheck className="h-5 w-5" />
          <span className="text-[7px] font-bold uppercase tracking-wider">
            Passport
          </span>
        </motion.div>
      </div>
    </div>
  )
})

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-wider text-white/50">{label}</p>
      <p className="font-display text-lg font-bold text-white">{value}</p>
      {sub && <p className="text-[8px] text-gold/90">{sub}</p>}
    </div>
  )
}

function GithubMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5Z" />
    </svg>
  )
}

function LinkedinMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33 0-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

function CardBack({ profile, qr }: { profile: BuilderProfile; qr: string }) {
  const [msg, setMsg] = useState<string | null>(null)

  const flashes: Record<string, string> = {
    palm: 'Build in Paradise',
    sun: 'Rise & Ship',
    ocean: 'Catch the wave',
    board: 'Ride the Next Wave',
  }

  const show = (k: string) => {
    setMsg(flashes[k])
    window.setTimeout(() => setMsg(null), 1400)
  }

  const githubHandle = safeHandle(profile.github)
  const linkedinHandle = safeHandle(profile.linkedin)
  const portfolioUrl = safeUrl(profile.portfolio)

  const links = [
    githubHandle && { icon: GithubMark, label: profile.github!, href: `https://github.com/${githubHandle}` },
    linkedinHandle && { icon: LinkedinMark, label: profile.linkedin!, href: `https://linkedin.com/${linkedinHandle}` },
    portfolioUrl && { icon: Globe, label: profile.portfolio!, href: portfolioUrl },
    profile.location && { icon: MapPin, label: profile.location, href: undefined },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; href?: string }[]

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/15 shadow-[0_40px_120px_-30px_oklch(0.1_0.03_175/0.9)]"
      style={{
        background:
          'linear-gradient(165deg, oklch(0.6 0.14 40) 0%, oklch(0.42 0.1 300) 60%, oklch(0.24 0.06 200) 100%)',
      }}
    >
      {/* interactive scene */}
      <button
        onClick={() => show('sun')}
        className="absolute right-8 top-8 h-16 w-16 rounded-full transition-transform hover:scale-110"
        style={{
          background:
            'radial-gradient(circle, oklch(0.96 0.09 90), oklch(0.85 0.16 70) 60%, transparent 75%)',
        }}
        aria-label="Sun"
      />
      <button
        onClick={() => show('palm')}
        className="absolute bottom-24 left-4 transition-transform hover:scale-105"
        aria-label="Palm tree"
      >
        <svg viewBox="0 0 100 200" className="h-40 w-20" fill="oklch(0.2 0.04 175)">
          <path d="M48 200 C 46 140 45 100 50 70 C 52 100 52 140 52 200 Z" />
          <path d="M50 70 C 30 55 15 58 2 70 C 20 52 40 55 50 70 Z" />
          <path d="M50 70 C 70 55 85 58 98 70 C 80 52 60 55 50 70 Z" />
          <path d="M50 70 C 35 40 26 22 22 6 C 40 34 48 52 50 70 Z" />
          <path d="M50 70 C 65 40 74 22 78 6 C 60 34 52 52 50 70 Z" />
        </svg>
      </button>
      <button
        onClick={() => show('board')}
        className="absolute bottom-6 right-6 h-24 w-7 rounded-full border border-white/40 transition-transform hover:scale-105"
        style={{
          background: 'linear-gradient(180deg, oklch(0.86 0.15 80), oklch(0.68 0.2 5))',
        }}
        aria-label="Surfboard"
      />
      <button
        onClick={() => show('ocean')}
        className="absolute inset-x-0 bottom-0 h-14"
        style={{
          background:
            'linear-gradient(180deg, oklch(0.5 0.12 200 / 0.6), oklch(0.28 0.06 200))',
        }}
        aria-label="Ocean"
      />

      {/* flash message */}
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 font-display text-sm font-semibold text-white backdrop-blur"
        >
          {msg}
        </motion.div>
      )}

      {/* content */}
      <div className="relative flex h-full flex-col p-6">
        <div className="mt-2">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
            Builder Links
          </p>
          <p className="mt-1 max-w-[65%] text-xs text-white/60">
            {profile.tagline}
          </p>
        </div>

        <div className="mt-auto space-y-2">
          {links.map(({ icon: Icon, label, href }, i) =>
            href ? (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-xl bg-black/25 px-3 py-2 text-xs text-white/90 backdrop-blur transition-colors hover:bg-black/40"
              >
                <Icon className="h-3.5 w-3.5 text-gold" />
                <span className="truncate">{label}</span>
              </a>
            ) : (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-xl bg-black/25 px-3 py-2 text-xs text-white/90 backdrop-blur"
              >
                <Icon className="h-3.5 w-3.5 text-gold" />
                <span className="truncate">{label}</span>
              </div>
            ),
          )}

          <div className="flex items-center gap-3 rounded-xl bg-white/90 p-2.5">
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr || '/placeholder.svg'} alt="QR" className="h-12 w-12 rounded" />
            )}
            <div>
              <p className="font-mono text-[10px] text-forest/60">SCAN TO CONNECT</p>
              <p className="font-mono text-xs font-semibold text-forest">
                {profile.builderId}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
