'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ImageUp, User } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { BuilderInput } from '@/lib/builder'
import { readImageFileSafely } from '@/lib/utils'

const ease = [0.22, 1, 0.36, 1] as const
const DRAFT_KEY = 'hhg-builder-form-draft'

const FIELD_LIMITS = {
  name: 40,
  role: 60,
  location: 40,
  github: 40,
  portfolio: 60,
  linkedin: 40,
} as const

type Fields = Omit<BuilderInput, 'photo'>

export function BuilderForm({
  onBack,
  onSubmit,
}: {
  onBack: () => void
  onSubmit: (input: BuilderInput) => void
}) {
  const [photo, setPhoto] = useState<string | undefined>()
  const [dragging, setDragging] = useState(false)
  const [fields, setFields] = useState<Fields>({
    name: '',
    role: '',
    location: '',
    github: '',
    portfolio: '',
    linkedin: '',
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Restore a previously-typed draft (text only — never the photo) so a
  // refresh or dropped connection at a crowded event doesn't lose progress.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY)
      if (saved) setFields(JSON.parse(saved))
    } catch {
      // ignore corrupt/unavailable storage
    }
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(fields))
    } catch {
      // storage may be unavailable (private browsing) — non-fatal
    }
  }, [fields])

  const readFile = useCallback((file: File) => {
    setPhotoError(null)
    readImageFileSafely(file)
      .then(setPhoto)
      .catch((e: Error) => setPhotoError(e.message))
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) readFile(file)
  }

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }))

  const canSubmit = fields.name.trim() && fields.role.trim()

  const submit = () => {
    if (!canSubmit) return
    try {
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      // non-fatal
    }
    onSubmit({ ...fields, photo })
  }

  return (
    <motion.div
      key="form"
      className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-6 py-16"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
      transition={{ duration: 0.7, ease }}
    >
      <button
        onClick={onBack}
        className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-sand/70 transition-colors hover:text-sand"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="glass rounded-3xl border border-border/80 bg-forest/55 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
      <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Tell us who&apos;s building
      </h2>
      <p className="mt-2 text-sand/70">
        A few details. We&apos;ll craft the rest of your identity.
      </p>

      {/* Upload */}
      <motion.button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        animate={{ scale: dragging ? 1.02 : 1 }}
        transition={{ duration: 0.3, ease }}
        className={`glass group mt-8 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-8 text-center transition-colors ${
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
        <AnimatePresence mode="wait">
          {photo ? (
            <motion.img
              key="preview"
              src={photo || '/placeholder.svg'}
              alt="Your uploaded builder photo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease }}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-gold/70"
            />
          ) : (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold transition-transform duration-300 group-hover:scale-110">
                <ImageUp className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">Drop your photo here</span>
              <span className="text-xs text-sand/60">
                PNG · JPG · JPEG · HEIC — optional
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {photo && (
          <span className="text-xs text-sand/60">Tap to replace</span>
        )}
      </motion.button>
      {photoError && (
        <p className="mt-2 text-center text-xs text-red-400">{photoError}</p>
      )}

      {/* Fields */}
      <div className="mt-6 space-y-4">
        <Field
          label="Name"
          placeholder="Ada Lovelace"
          value={fields.name}
          onChange={set('name')}
          required
          maxLength={FIELD_LIMITS.name}
          icon={<User className="h-4 w-4" />}
        />
        <Field
          label="Role / Stack"
          placeholder="Frontend · React · TypeScript"
          value={fields.role}
          onChange={set('role')}
          required
          maxLength={FIELD_LIMITS.role}
          hint="Drives your Builder Title & skill tags"
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Location" placeholder="Goa, IN" value={fields.location} onChange={set('location')} optional maxLength={FIELD_LIMITS.location} />
          <Field label="GitHub" placeholder="@handle" value={fields.github} onChange={set('github')} optional maxLength={FIELD_LIMITS.github} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Portfolio" placeholder="site.com" value={fields.portfolio} onChange={set('portfolio')} optional maxLength={FIELD_LIMITS.portfolio} />
          <Field label="LinkedIn" placeholder="in/handle" value={fields.linkedin} onChange={set('linkedin')} optional maxLength={FIELD_LIMITS.linkedin} />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!canSubmit}
        className="group mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 font-medium text-accent-foreground transition-all duration-300 enabled:hover:scale-[1.02] enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Generate My Passport
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-enabled:group-hover:translate-x-1" />
      </button>
      </div>
    </motion.div>
  )
}

function Field({
  label,
  hint,
  optional,
  required,
  icon,
  ...props
}: {
  label: string
  hint?: string
  optional?: boolean
  required?: boolean
  icon?: React.ReactNode
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-sand/70">
        {label}
        {optional && <span className="text-sand/40">(optional)</span>}
        {required && <span className="text-gold">*</span>}
      </span>
      <span className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-sand/50">{icon}</span>
        )}
        <input
          {...props}
          className={`w-full rounded-xl border border-border bg-secondary/40 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-sand/40 focus:border-gold/70 focus:bg-secondary/70 ${
            icon ? 'pl-9 pr-3' : 'px-3'
          }`}
        />
      </span>
      {hint && <span className="mt-1 block text-[11px] text-sand/45">{hint}</span>}
    </label>
  )
}
