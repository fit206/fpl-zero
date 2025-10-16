/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['resources.premierleague.com', 'images.fotmob.com', 'labs.google'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
}

export default nextConfig
