import { ImageResponse } from 'next/og'
import { cardFromLegacyParams, decodeCard, EVENT_NAME, HASHTAG_LINE, type CardData } from '@/lib/share'

export const runtime = 'nodejs'

const WIDTH = 1200
const HEIGHT = 630

// Brand palette in hex — Satori (the renderer behind ImageResponse) does not
// understand the oklch() values the app's CSS uses, so these are the hex
// equivalents of the same tokens.
const C = {
  sand: '#f4ecd8',
  gold: '#f5c445',
  pink: '#ff4d8d',
  emerald: '#2fd0a0',
  forest: '#062a20',
  cardTop: '#174a3c',
  cardMid: '#103528',
  cardBottom: '#0b2820',
  dusk: '#4a2c6b',
  coral: '#cf5f3d',
  amber: '#f0a93a',
}

/** Shown when the URL carries no card — i.e. the plain homepage preview. */
const DEFAULT_CARD: CardData = {
  name: 'Your Name',
  title: 'Creative Builder',
  role: 'Claim your builder identity',
  tagline: 'Where builders become founders — from paradise.',
  levelName: 'Rising Builder',
  builderId: 'HHG-26-0000',
  date: '',
  xp: 2400,
  level: 2,
  skills: ['Builder', 'Shipper', 'Goa 2026'],
}

// Best-effort in-memory rate limit. Serverless instances are stateless across
// regions, so this only smooths out a single hot instance — it is not a
// substitute for a real rate limiter (e.g. Vercel KV / Upstash) under abuse.
// The ceiling is deliberately high: link-preview crawlers can burst, and a
// blocked crawler means a blank preview.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 120
const hits = new Map<string, { count: number; windowStart: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT_MAX_REQUESTS
}

/**
 * Fetches a Google font as TTF so Satori can use it (Satori cannot parse
 * woff2, which is what modern user agents are served — hence the vintage UA).
 * The `text` subset keeps the download to just the glyphs this card needs.
 */
async function loadGoogleFont(family: string, weight: number, text: string) {
  const url =
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}` +
    `&text=${encodeURIComponent(text)}`
  const css = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko) Version/5.1 Safari/534.30',
    },
    cache: 'force-cache',
  }).then((r) => r.text())

  const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
  if (!src) throw new Error(`No TTF source for ${family} ${weight}`)
  return fetch(src, { cache: 'force-cache' }).then((r) => r.arrayBuffer())
}

/**
 * Custom fonts are a nice-to-have: if Google Fonts is slow or unreachable we
 * still return a card (Satori falls back to its bundled font) rather than
 * failing the request and giving X a broken preview.
 */
async function loadFonts(text: string) {
  try {
    const [display, body, bodyBold] = await Promise.all([
      loadGoogleFont('Space Grotesk', 700, text),
      loadGoogleFont('Inter', 400, text),
      loadGoogleFont('Inter', 600, text),
    ])
    return [
      { name: 'Display', data: display, weight: 700 as const, style: 'normal' as const },
      { name: 'Body', data: body, weight: 400 as const, style: 'normal' as const },
      { name: 'Body', data: bodyBold, weight: 600 as const, style: 'normal' as const },
    ]
  } catch {
    return []
  }
}

function readCard(searchParams: URLSearchParams): CardData {
  return (
    decodeCard(searchParams.get('c')) ??
    cardFromLegacyParams(searchParams.get('name'), searchParams.get('title')) ??
    DEFAULT_CARD
  )
}

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return new Response('Too many requests', { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const card = readCard(searchParams)

  const glyphs =
    `${card.name}${card.title}${card.role}${card.tagline}${card.levelName}${card.builderId}` +
    `${card.date}${card.skills.join('')}${card.xp.toLocaleString()}${card.level}` +
    `${EVENT_NAME}${HASHTAG_LINE}` +
    'HACKER HOUSE GOA · 2026 BUILDER PASSPORT XP Level Builder ID ' +
    'Where builders become founders abcdefghijklmnopqrstuvwxyz' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ·—-.,#/&+@!?%()'

  const fonts = await loadFonts(glyphs)
  const initial = card.name.slice(0, 1).toUpperCase() || 'B'

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
          background: `linear-gradient(140deg, ${C.forest} 0%, #0b3428 40%, #123a2e 58%, #6d2f48 85%, #b9822f 100%)`,
          color: C.sand,
          fontFamily: 'Body',
          padding: '35px 48px',
          alignItems: 'center',
        }}
      >
        {/* sun bloom */}
        <div
          style={{
            position: 'absolute',
            top: '-180px',
            right: '-140px',
            width: '540px',
            height: '540px',
            borderRadius: '9999px',
            background: `radial-gradient(circle, ${C.gold} 0%, ${C.amber} 48%, rgba(240,169,58,0) 70%)`,
            opacity: 0.55,
          }}
        />

        {/* THE CARD — same composition as the passport the user just generated */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            width: '350px',
            height: '560px',
            flexShrink: 0,
            borderRadius: '28px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.18)',
            background: `linear-gradient(165deg, ${C.cardTop} 0%, ${C.cardMid} 55%, ${C.cardBottom} 100%)`,
            boxShadow: '0 40px 90px rgba(2,18,13,0.55)',
          }}
        >
          {/* goa sky band */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '212px',
              background: `linear-gradient(180deg, ${C.dusk} 0%, ${C.coral} 45%, ${C.amber} 80%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '68px',
              left: '95px',
              width: '160px',
              height: '160px',
              borderRadius: '9999px',
              background: 'radial-gradient(circle, #fdf3c4 0%, #f7cf6a 55%, rgba(247,207,106,0) 72%)',
            }}
          />
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: '180px',
              left: 0,
              right: 0,
              height: '32px',
              background: 'linear-gradient(180deg, rgba(214,124,60,0.85), #14544a)',
            }}
          />

          {/* header */}
          <div
            style={{
              display: 'flex',
              position: 'relative',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px 0',
            }}
          >
            <div
              style={{
                fontFamily: 'Display',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '2.2px',
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              HACKER HOUSE GOA
            </div>
            <div
              style={{
                display: 'flex',
                borderRadius: '9999px',
                background: 'rgba(0,0,0,0.28)',
                padding: '2px 9px',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.88)',
              }}
            >
              2026
            </div>
          </div>

          {/* avatar */}
          <div
            style={{
              display: 'flex',
              position: 'relative',
              justifyContent: 'center',
              marginTop: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '112px',
                height: '112px',
                borderRadius: '9999px',
                border: `4px solid ${C.sand}`,
                background: 'rgba(47,208,160,0.28)',
                fontFamily: 'Display',
                fontSize: '42px',
                fontWeight: 700,
                color: C.sand,
              }}
            >
              {initial}
            </div>
          </div>

          {/* identity */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              alignItems: 'center',
              marginTop: '16px',
              padding: '0 20px',
            }}
          >
            <div
              style={{
                fontFamily: 'Display',
                fontSize: card.name.length > 18 ? '20px' : '25px',
                fontWeight: 700,
                color: '#ffffff',
                textAlign: 'center',
              }}
            >
              {card.name}
            </div>
            <div style={{ marginTop: '5px', fontSize: '14px', fontWeight: 600, color: C.gold }}>
              {card.title}
            </div>
            {card.role ? (
              <div
                style={{
                  marginTop: '3px',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.6)',
                  textAlign: 'center',
                }}
              >
                {card.role}
              </div>
            ) : null}
          </div>

          {/* xp / level */}
          <div
            style={{
              display: 'flex',
              position: 'relative',
              margin: '16px 20px 0',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '16px',
              background: 'rgba(0,0,0,0.28)',
              padding: '10px 16px',
            }}
          >
            <Stat label="BUILDER XP" value={card.xp.toLocaleString()} />
            <div style={{ display: 'flex', width: '1px', height: '32px', background: 'rgba(255,255,255,0.16)' }} />
            <Stat label="LEVEL" value={String(card.level)} sub={card.levelName} />
          </div>

          {/* skills */}
          <div
            style={{
              display: 'flex',
              position: 'relative',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '6px',
              margin: '12px 20px 0',
            }}
          >
            {card.skills.map((skill) => (
              <div
                key={skill}
                style={{
                  display: 'flex',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '3px 10px',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.82)',
                }}
              >
                {skill}
              </div>
            ))}
          </div>

          {/* footer */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: '18px',
              left: '20px',
              right: '20px',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>BUILDER ID</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
                {card.builderId || 'HHG-26'}
              </div>
              {card.date ? (
                <div style={{ marginTop: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.45)' }}>
                  {card.date}
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '58px',
                height: '58px',
                borderRadius: '9999px',
                border: `2px solid ${C.gold}`,
                color: C.gold,
                transform: 'rotate(-8deg)',
              }}
            >
              {/* lucide ShieldCheck — drawn rather than typed, because Google's
                  font subsetter does not ship symbol glyphs like ✓ */}
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <div style={{ fontSize: '7px', fontWeight: 600, letterSpacing: '1px' }}>PASSPORT</div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — the headline for the timeline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            flex: 1,
            height: '560px',
            justifyContent: 'center',
            paddingLeft: '52px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', width: '14px', height: '14px', borderRadius: '9999px', background: C.gold }} />
            <div
              style={{
                fontFamily: 'Display',
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '4px',
                color: 'rgba(244,236,216,0.9)',
              }}
            >
              BUILDER PASSPORT · 2026
            </div>
          </div>

          <div
            style={{
              fontFamily: 'Display',
              fontSize: card.name.length > 16 ? '62px' : '80px',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-2px',
              marginTop: '18px',
              color: '#ffffff',
            }}
          >
            {card.name}
          </div>

          <div style={{ display: 'flex', marginTop: '10px', fontSize: '34px', fontWeight: 600, color: C.gold }}>
            {card.title}
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: '18px',
              fontSize: '24px',
              color: 'rgba(244,236,216,0.75)',
              maxWidth: '620px',
            }}
          >
            {card.tagline || 'Where builders become founders — from paradise.'}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '26px', flexWrap: 'wrap' }}>
            {[card.levelName, `${card.xp.toLocaleString()} XP`, card.builderId]
              .filter(Boolean)
              .map((chip) => (
                <div
                  key={chip}
                  style={{
                    display: 'flex',
                    borderRadius: '9999px',
                    border: '1px solid rgba(244,236,216,0.28)',
                    background: 'rgba(0,0,0,0.22)',
                    padding: '7px 16px',
                    fontSize: '18px',
                    color: 'rgba(244,236,216,0.9)',
                  }}
                >
                  {chip}
                </div>
              ))}
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: '34px',
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '1px',
              color: C.pink,
            }}
          >
            {HASHTAG_LINE}
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: fonts.length ? fonts : undefined,
      headers: {
        // Output is a pure function of the query string, so it is safe to let
        // X / Slack / WhatsApp crawlers and the CDN cache it hard.
        'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: '9px', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      <div style={{ fontFamily: 'Display', fontSize: '19px', fontWeight: 700, color: '#ffffff' }}>{value}</div>
      {sub ? <div style={{ fontSize: '8px', color: 'rgba(245,196,69,0.9)' }}>{sub}</div> : null}
    </div>
  )
}
