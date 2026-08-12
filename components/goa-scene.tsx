'use client'

import { useEffect, useRef } from 'react'

type GoaSceneProps = {
  /** 0 = calm landing, 1 = focused/dimmed for reveal */
  dim?: number
  /** pointer parallax offset in px */
  parallax?: { x: number; y: number }
}

/**
 * Layered, GPU-friendly Goa sunset.
 * Sky gradient + sun glow + ocean shimmer + swaying palms + drifting particles.
 */
export function GoaScene({ dim = 0, parallax = { x: 0, y: 0 } }: GoaSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number }
    let particles: P[] = []

    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(60, Math.floor((width * height) / 26000))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.4,
        vy: -(Math.random() * 0.25 + 0.05),
        vx: (Math.random() - 0.5) * 0.15,
        a: Math.random() * 0.5 + 0.2,
      }))
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (const p of particles) {
        p.y += p.vy
        p.x += p.vx
        if (p.y < -5) {
          p.y = height + 5
          p.x = Math.random() * width
        }
        if (p.x < -5) p.x = width + 5
        if (p.x > width + 5) p.x = -5
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 236, 190, ${p.a})`
        ctx.fill()
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const px = parallax.x
  const py = parallax.y

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, oklch(0.24 0.05 250) 0%, oklch(0.32 0.07 300) 22%, oklch(0.55 0.14 30) 48%, oklch(0.75 0.16 55) 63%, oklch(0.86 0.15 80) 72%)',
        }}
      />

      {/* Sun */}
      <div
        className="absolute left-1/2 top-[46%] h-[42vmax] w-[42vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          transform: `translate(calc(-50% + ${px * 0.4}px), calc(-50% + ${py * 0.4}px))`,
          background:
            'radial-gradient(circle at center, oklch(0.95 0.11 90) 0%, oklch(0.88 0.16 75) 30%, oklch(0.78 0.18 45 / 0.55) 52%, transparent 70%)',
          filter: 'blur(2px)',
        }}
      />
      <div
        className="absolute left-1/2 top-[46%] h-[18vmax] w-[18vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          transform: `translate(calc(-50% + ${px * 0.4}px), calc(-50% + ${py * 0.4}px))`,
          background:
            'radial-gradient(circle at center, oklch(0.98 0.06 95) 0%, oklch(0.92 0.14 82) 55%, transparent 72%)',
        }}
      />

      {/* Ocean */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38%]"
        style={{
          background:
            'linear-gradient(180deg, oklch(0.6 0.12 55) 0%, oklch(0.4 0.09 170) 34%, oklch(0.24 0.06 180) 100%)',
        }}
      >
        {/* Golden reflection streak */}
        <div
          className="absolute left-1/2 top-0 h-full w-[40%] -translate-x-1/2"
          style={{
            transform: `translateX(calc(-50% + ${px * 0.4}px))`,
            background:
              'radial-gradient(60% 100% at 50% 0%, oklch(0.92 0.15 82 / 0.5), oklch(0.85 0.15 75 / 0.12) 45%, transparent 75%)',
            filter: 'blur(10px)',
            maskImage:
              'repeating-linear-gradient(180deg, black 0 3px, transparent 3px 9px)',
            WebkitMaskImage:
              'repeating-linear-gradient(180deg, black 0 3px, transparent 3px 9px)',
            animation: 'shimmer 6s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Palm silhouettes */}
      <Palm className="absolute -left-6 bottom-[30%] h-[52vh] w-auto" delay={0} px={px} strength={0.9} />
      <Palm
        className="absolute -right-10 bottom-[31%] h-[62vh] w-auto scale-x-[-1]"
        delay={1.2}
        px={px}
        strength={1.2}
      />

      {/* Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Vignette + dim overlay for reveal focus */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 20%, transparent 40%, oklch(0.12 0.03 175 / 0.7) 100%)',
        }}
      />
      <div
        className="absolute inset-0 bg-forest transition-opacity duration-700"
        style={{ opacity: dim * 0.55 }}
      />
    </div>
  )
}

function Palm({
  className,
  delay,
  px,
  strength,
}: {
  className: string
  delay: number
  px: number
  strength: number
}) {
  return (
    <div
      className={className}
      style={{
        transformOrigin: 'bottom center',
        transform: `translateX(${px * strength * 0.6}px)`,
        animation: `sway 7s ease-in-out ${delay}s infinite`,
        // @ts-expect-error custom props
        '--sway-from': '-2.5deg',
        '--sway-to': '2.5deg',
      }}
    >
      <svg viewBox="0 0 200 400" className="h-full w-full" fill="oklch(0.16 0.03 175)">
        {/* trunk */}
        <path d="M96 400 C 92 300 90 220 100 150 C 104 220 104 300 104 400 Z" />
        {/* fronds */}
        <g>
          <path d="M100 150 C 60 120 30 130 4 150 C 40 118 78 120 100 150 Z" />
          <path d="M100 150 C 140 120 170 130 196 150 C 160 118 122 120 100 150 Z" />
          <path d="M100 150 C 70 100 50 70 40 40 C 78 78 96 110 100 150 Z" />
          <path d="M100 150 C 130 100 150 70 160 40 C 122 78 104 110 100 150 Z" />
          <path d="M100 150 C 96 108 98 74 100 44 C 104 78 104 112 100 150 Z" />
        </g>
      </svg>
    </div>
  )
}
