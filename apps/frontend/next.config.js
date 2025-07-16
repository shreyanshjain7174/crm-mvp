/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',
  },
  // Configure for different deployment modes
  ...(process.env.GITHUB_PAGES === 'true' ? {
    // GitHub Pages configuration
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    basePath: '',
    assetPrefix: '',
  } : {
    // Docker/Production configuration
    output: 'standalone',
    experimental: {
      outputFileTracingRoot: require('path').join(__dirname, '../../'),
    },
  }),
}

module.exports = nextConfig