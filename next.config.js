/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is stable in Next.js 13.4+
  // Ensure API routes work on Netlify
  trailingSlash: false,
  // Set default port
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  // Remove output: 'standalone' for Netlify
  // output: 'standalone'
}

module.exports = nextConfig
