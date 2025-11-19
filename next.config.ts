import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for Cloudflare Pages
  images: {
    unoptimized: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Webpack configuration for Edge runtime
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'node:crypto': false,
        'crypto': false,
      };
    }
    return config;
  },
};

export default nextConfig;
