/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right'
  },
  images: {
    domains: ['images.pexels.com'],
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
};

module.exports = nextConfig;