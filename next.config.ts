import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable static optimization for Cloudflare Pages
  output: 'export',

  // Required for Cloudflare Pages
  images: {
    unoptimized: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
