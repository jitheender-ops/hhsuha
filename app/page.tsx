import type { Metadata } from 'next'
import { BuilderExperience } from '@/components/builder-experience'
import { cardFromLegacyParams, decodeCard, EVENT_NAME, ogImagePath } from '@/lib/share'
import { siteUrl } from '@/lib/site'

// A shared passport links back here with ?c=<token>. The token carries the
// whole card (name, title, XP, level, skills, builder ID), so X's crawler gets
// OG metadata — and an /api/og image — for THIS person's passport instead of
// the generic site default in app/layout.tsx.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; name?: string; title?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const card = decodeCard(params.c) ?? cardFromLegacyParams(params.name, params.title)
  if (!card) return {}

  const token = params.c
  const base = siteUrl()
  const ogUrl = token
    ? `${base}${ogImagePath(token)}`
    : `${base}/api/og?name=${encodeURIComponent(card.name)}&title=${encodeURIComponent(card.title)}`

  // Must be the shared link itself, not the bare origin: crawlers that honour
  // og:url as canonical (Facebook, Slack) would otherwise re-scrape the
  // homepage and show the generic image instead of this person's card.
  const canonical = token
    ? `${base}/?c=${encodeURIComponent(token)}`
    : `${base}/?name=${encodeURIComponent(card.name)}&title=${encodeURIComponent(card.title)}`

  const cardTitle = `${card.name} — ${card.title} · ${EVENT_NAME}`
  const description = card.tagline
    ? `${card.tagline} Get your own Builder Passport for ${EVENT_NAME}.`
    : `Get your own Builder Passport for ${EVENT_NAME}.`
  const alt = `${card.name}'s Builder Passport for ${EVENT_NAME}`

  return {
    title: cardTitle,
    description,
    openGraph: {
      title: cardTitle,
      description,
      type: 'website',
      url: canonical,
      images: [{ url: ogUrl, width: 1200, height: 630, alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: cardTitle,
      description,
      images: [{ url: ogUrl, alt }],
    },
  }
}

export default function Page() {
  return <BuilderExperience />
}
