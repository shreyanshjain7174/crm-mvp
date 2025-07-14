/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',
  },
  // Configure for GitHub Pages deployment
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Set base path for GitHub Pages
  basePath: '/crm-mvp',
  assetPrefix: '/crm-mvp/',
}

module.exports = nextConfig