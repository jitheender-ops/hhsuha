import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { siteUrl } from '@/lib/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const title = 'Hacker House Goa 2026 — Builder Passport'
const description =
  'Generate your premium Builder Passport for Hacker House Goa 2026. Where builders become founders — from paradise.'

export const metadata: Metadata = {
  title,
  description,
  generator: 'v0.app',
  // Derived from the deployment rather than hardcoded — a stale value here
  // points link previews at a host that isn't serving this app.
  metadataBase: new URL(siteUrl()),
  openGraph: {
    title,
    description,
    type: 'website',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Hacker House Goa 2026 Builder Passport',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/api/og'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#062a20',
  width: 'device-width',
  initialScale: 1,
  // Pinch-to-zoom is left enabled (no maximumScale/userScalable lock) so the
  // app doesn't fail WCAG 1.4.4 for low-vision users.
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} bg-background`}
    >
      <body className="antialiased overflow-x-hidden">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
