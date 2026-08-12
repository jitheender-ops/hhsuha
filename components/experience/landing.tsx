'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { HHLogo } from '@/components/hh-logo'

const ease = [0.22, 1, 0.36, 1] as const

export function Landing({
  onCreate,
  onPfp,
}: {
  onCreate: () => void
  onPfp: () => void
}) {
  return (
    <motion.div
      key="landing"
      className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
      transition={{ duration: 0.8, ease }}
    >
      <motion.div
        className="absolute top-7 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease, delay: 0.1 }}
      >
        <HHLogo />
      </motion.div>

      <motion.div
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-medium tracking-wide text-sand/90 glass"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease, delay: 0.2 }}
      >
        <Sparkles className="h-3.5 w-3.5 text-gold" />
        Builder Passport · 2026 Edition
      </motion.div>

      <motion.p
        className="font-display text-sm font-medium uppercase tracking-[0.4em] text-gold/90"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease, delay: 0.3 }}
      >
        Welcome to
      </motion.p>

      <motion.h1
        className="mt-3 font-display text-5xl font-bold leading-[0.95] tracking-tight text-balance sm:text-7xl md:text-8xl"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease, delay: 0.4 }}
      >
        Hacker House
        <br />
        <span className="bg-gradient-to-r from-gold via-sand to-pink bg-clip-text text-transparent">
          Goa 2026
        </span>
      </motion.h1>

      <motion.p
        className="mt-6 max-w-md text-pretty text-base text-sand/80 sm:text-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease, delay: 0.55 }}
      >
        Where builders become founders. Claim your official Builder Passport and
        join an exclusive community creating startups from paradise.
      </motion.p>

      <motion.div
        className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease, delay: 0.7 }}
      >
        <button
          onClick={onCreate}
          className="group inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-medium text-accent-foreground shadow-[0_10px_40px_-12px_oklch(0.86_0.15_80/0.8)] transition-transform duration-300 hover:scale-[1.03] active:scale-95"
        >
          Create My Builder Passport
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <button
          onClick={onPfp}
          className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 font-medium text-sand transition-colors duration-300 hover:bg-secondary glass"
        >
          Generate PFP Frame
        </button>
      </motion.div>

      <motion.p
        className="absolute bottom-6 text-xs text-sand/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        No login. No signup. Just build.
      </motion.p>
    </motion.div>
  )
}
