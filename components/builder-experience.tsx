'use client'

import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { generateProfile, type BuilderInput, type BuilderProfile } from '@/lib/builder'
import { GoaScene } from '@/components/goa-scene'
import { Landing } from '@/components/experience/landing'
import { BuilderForm } from '@/components/experience/builder-form'
import { Generating } from '@/components/experience/generating'
import { ResultScreen } from '@/components/experience/result'
import { PfpGenerator } from '@/components/experience/pfp-generator'

type Stage = 'landing' | 'form' | 'generating' | 'result' | 'pfp'

export function BuilderExperience() {
  const [stage, setStage] = useState<Stage>('landing')
  const [profile, setProfile] = useState<BuilderProfile | null>(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const raf = useRef(0)

  // Pointer parallax for the background scene
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf.current)
      raf.current = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 40
        const y = (e.clientY / window.innerHeight - 0.5) * 24
        setParallax({ x, y })
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  const handleSubmit = useCallback((input: BuilderInput) => {
    setProfile(generateProfile(input))
    setStage('generating')
  }, [])

  const dim = stage === 'generating' || stage === 'result' ? 1 : 0

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      <GoaScene dim={dim} parallax={parallax} />

      <AnimatePresence mode="wait">
        {stage === 'landing' && (
          <Landing
            key="landing"
            onCreate={() => setStage('form')}
            onPfp={() => setStage('pfp')}
          />
        )}

        {stage === 'form' && (
          <BuilderForm
            key="form"
            onBack={() => setStage('landing')}
            onSubmit={handleSubmit}
          />
        )}

        {stage === 'generating' && (
          <Generating key="generating" onDone={() => setStage('result')} />
        )}

        {stage === 'result' && profile && (
          <ResultScreen
            key="result"
            profile={profile}
            onRestart={() => {
              setProfile(null)
              setStage('form')
            }}
          />
        )}

        {stage === 'pfp' && (
          <PfpGenerator key="pfp" onBack={() => setStage('landing')} />
        )}
      </AnimatePresence>
    </main>
  )
}
