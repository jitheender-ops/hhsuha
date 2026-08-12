/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors now fail the build instead of being silently ignored.
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
