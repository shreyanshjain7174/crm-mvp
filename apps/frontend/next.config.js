/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',
  },
  // Skip linting and type checking during Docker build (already done in CI)
  ...(process.env.DOCKER_BUILD === 'true' ? {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
  } : {}),
  // Configure for different deployment modes
  ...(process.env.GITHUB_PAGES === 'true' ? {
    // GitHub Pages configuration
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    basePath: '/crm-mvp',
    assetPrefix: '/crm-mvp',
  } : {
    // Docker/Production configuration
    output: 'standalone',
    experimental: {
      outputFileTracingRoot: require('path').join(__dirname, '../../'),
    },
  }),
}

module.exports = nextConfig