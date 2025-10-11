/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is stable in Next.js 13.4+
  experimental: {
    serverComponentsExternalPackages: []
  },
  // Ensure API routes work on Netlify
  trailingSlash: false,
  // Enable serverless functions
  output: 'standalone'
}

module.exports = nextConfig
