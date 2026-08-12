'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { GENERATION_STEPS } from '@/lib/builder'

const ease = [0.22, 1, 0.36, 1] as const

export function Generating({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const total = GENERATION_STEPS.length
  // The profile itself is computed instantly — this sequence is theatre. Keep
  // it short enough that upload-to-result stays around two seconds.
  const perStep = 320

  useEffect(() => {
    const timers = GENERATION_STEPS.map((_, i) =>
      setTimeout(() => setStep(i), i * perStep),
    )
    const finish = setTimeout(() => onDone(), total * perStep + 200)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(finish)
    }
  }, [onDone, total])

  const progress = Math.round(((step + 1) / total) * 100)

  return (
    <motion.div
      key="generating"
      className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: 0.6, ease }}
    >
      {/* pulsing orb */}
      <motion.div
        className="mb-10 h-20 w-20 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 40% 35%, oklch(0.95 0.1 90), oklch(0.78 0.18 55) 60%, oklch(0.68 0.2 5) 100%)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity }}
      />

      <div className="h-8 overflow-hidden" aria-live="polite" role="status">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            className="font-display text-xl font-semibold tracking-tight sm:text-2xl"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.4, ease }}
          >
            {GENERATION_STEPS[step]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* progress */}
      <div
        className="mt-8 h-1.5 w-64 overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald via-gold to-pink"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45, ease }}
        />
      </div>
      <p className="mt-3 font-mono text-xs text-sand/60">{progress}%</p>
    </motion.div>
  )
}
