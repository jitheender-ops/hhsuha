import type { BuilderProfile } from './builder'

export const EVENT_NAME = 'Hacker House Goa 2026'

/**
 * Hashtags every share carries. #FrameInGoa is the event tag; the Goa tags
 * widen reach beyond people who already know the event.
 */
export const SHARE_HASHTAGS = ['FrameInGoa', 'HackerHouseGoa', 'Goa'] as const

export const HASHTAG_LINE = SHARE_HASHTAGS.map((h) => `#${h}`).join(' ')

/**
 * The subset of a profile that travels in the share URL. The photo is
 * deliberately excluded — it is a multi-megabyte data URL and would never fit
 * in a link. Everything else is enough for /api/og to redraw the card.
 */
export type CardData = {
  name: string
  title: string
  role: string
  tagline: string
  levelName: string
  builderId: string
  date: string
  xp: number
  level: number
  skills: string[]
}

/** Wire format — short keys so the shared URL stays comfortably short. */
type Wire = {
  n: string
  t: string
  r: string
  g: string
  ln: string
  i: string
  d: string
  x: number
  l: number
  s: string[]
}

const LIMITS = {
  name: 40,
  title: 34,
  role: 60,
  tagline: 80,
  levelName: 24,
  builderId: 16,
  date: 20,
  skill: 16,
  skills: 6,
} as const

/** Longest payload we will even attempt to decode, as a cheap abuse guard. */
const MAX_ENCODED_LENGTH = 2048

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max)
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Packs a profile into a single URL-safe token. Runs in the browser. */
export function encodeCard(profile: BuilderProfile): string {
  const wire: Wire = {
    n: clean(profile.name, LIMITS.name),
    t: clean(profile.title, LIMITS.title),
    r: clean(profile.role, LIMITS.role),
    g: clean(profile.tagline, LIMITS.tagline),
    ln: clean(profile.levelName, LIMITS.levelName),
    i: clean(profile.builderId, LIMITS.builderId),
    d: clean(profile.date, LIMITS.date),
    x: clampInt(profile.xp, 0, 99_999, 0),
    l: clampInt(profile.level, 1, 99, 1),
    s: (profile.skills ?? []).slice(0, LIMITS.skills).map((s) => clean(s, LIMITS.skill)).filter(Boolean),
  }
  return toBase64Url(new TextEncoder().encode(JSON.stringify(wire)))
}

/**
 * Reverses encodeCard. Every field is re-sanitized here rather than trusted,
 * because this input arrives from a URL that anyone can hand-craft — it is
 * rendered into an image and into OG metadata.
 */
export function decodeCard(token: string | undefined | null): CardData | null {
  if (!token || token.length > MAX_ENCODED_LENGTH) return null
  try {
    const wire = JSON.parse(new TextDecoder().decode(fromBase64Url(token))) as Partial<Wire>
    const name = clean(wire.n, LIMITS.name)
    if (!name) return null
    return {
      name,
      title: clean(wire.t, LIMITS.title) || 'Creative Builder',
      role: clean(wire.r, LIMITS.role),
      tagline: clean(wire.g, LIMITS.tagline),
      levelName: clean(wire.ln, LIMITS.levelName),
      builderId: clean(wire.i, LIMITS.builderId),
      date: clean(wire.d, LIMITS.date),
      xp: clampInt(wire.x, 0, 99_999, 0),
      level: clampInt(wire.l, 1, 99, 1),
      skills: Array.isArray(wire.s)
        ? wire.s.slice(0, LIMITS.skills).map((s) => clean(s, LIMITS.skill)).filter(Boolean)
        : [],
    }
  } catch {
    return null
  }
}

/** Legacy `?name=&title=` links (shared before the compact token existed). */
export function cardFromLegacyParams(
  name: string | undefined | null,
  title: string | undefined | null,
): CardData | null {
  const cleanName = clean(name, LIMITS.name)
  if (!cleanName) return null
  return {
    name: cleanName,
    title: clean(title, LIMITS.title) || 'Creative Builder',
    role: '',
    tagline: '',
    levelName: '',
    builderId: '',
    date: '',
    xp: 0,
    level: 1,
    skills: [],
  }
}

/** The link that goes in the tweet. Its OG image is this person's card. */
export function shareUrl(origin: string, profile: BuilderProfile): string {
  return `${origin}/?c=${encodeCard(profile)}`
}

/** Path (relative to the site root) of the OG image for a given card token. */
export function ogImagePath(token: string): string {
  return `/api/og?c=${encodeURIComponent(token)}`
}

/** Pre-filled tweet copy. Ends with the hashtag line; X appends the URL after it. */
export function shareCaption(profile: BuilderProfile): string {
  const stats = [profile.levelName, `${profile.xp.toLocaleString()} XP`, profile.builderId]
    .filter(Boolean)
    .join(' · ')

  return [
    `Just got my Builder Passport for ${EVENT_NAME} 🌴🚀`,
    '',
    `${profile.name} — ${profile.title}`,
    stats,
    '',
    'Grab yours and I’ll see you in Goa 👇',
    HASHTAG_LINE,
  ]
    .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
    .join('\n')
}

/** Caption for the PFP frame, which has no per-person card behind it. */
export function pfpCaption(): string {
  return [
    `Framed and ready for ${EVENT_NAME} 🌴`,
    '',
    'New profile picture, same builder energy. Make yours 👇',
    HASHTAG_LINE,
  ].join('\n')
}

/**
 * Whether to hand this file to the OS share sheet instead of opening X's web
 * composer.
 *
 * Deliberately limited to phones and tablets. Desktop Chrome also implements
 * navigator.share({ files }), but there the OS sheet is a downgrade — it
 * rarely lists X at all, whereas the web composer opens straight into a
 * pre-filled post. On a phone the sheet is the better path by far: picking X
 * opens the app with the PNG genuinely attached.
 */
export function canShareFileNatively(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false

  const ua = navigator.userAgent
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
  const isMobile =
    uaData?.mobile ??
    // iPadOS reports a desktop Safari UA, so fall back to touch capability.
    (/Android|iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1))
  if (!isMobile) return false

  try {
    return navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

/**
 * X's web intent. Uses x.com/intent/post (twitter.com/intent/tweet still works
 * but costs an extra redirect hop before the composer appears).
 */
export function xIntentUrl(text: string, url?: string): string {
  const params = new URLSearchParams({ text })
  if (url) params.set('url', url)
  return `https://x.com/intent/post?${params.toString()}`
}
