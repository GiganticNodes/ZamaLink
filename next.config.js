/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    position: 'bottom-left'
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
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
};

module.exports = nextConfig;