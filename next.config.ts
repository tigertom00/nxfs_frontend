import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Production optimizations
  output: 'standalone',
  experimental: {
    // Add experimental options here if needed
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Environment variables that should be available to the client
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable webpack's hot module replacement in development
      config.watchOptions = {
        ignored: ['**/*'],
      };
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Images optimization for production
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
