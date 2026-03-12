import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow external images (user avatars from Clerk)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '*.clerk.accounts.dev' },
    ],
  },
  // Suppress build warnings for server-only packages
  serverExternalPackages: ['@neondatabase/serverless'],
};

export default nextConfig;
