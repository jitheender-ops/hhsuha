/**
 * Absolute base URL of this deployment — server-side only.
 *
 * This matters more than it looks: Next resolves relative OG image paths
 * against `metadataBase`, so if this points at the wrong host, every link
 * preview asks a domain that isn't running this app for its image and X shows
 * a blank thumbnail. Vercel's own env vars are preferred so preview and
 * production deployments each advertise themselves correctly.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return withProtocol(explicit)

  // Set by Vercel to the project's stable production domain.
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (production) return withProtocol(production)

  // Per-deployment URL (preview deployments, and production before a domain).
  const deployment = process.env.VERCEL_URL
  if (deployment) return withProtocol(deployment)

  // Self-hosted production without any of the above: fall back to the known
  // public domain rather than localhost, which would break every preview.
  return process.env.NODE_ENV === 'production'
    ? 'https://hh-goa-passport.vercel.app'
    : 'http://localhost:3000'
}

function withProtocol(host: string): string {
  const trimmed = host.trim().replace(/\/+$/, '')
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}
