import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@growcold/shared'],
  async redirects() {
    return [
      { source: '/receipts', destination: '/transactions', permanent: false },
      { source: '/receipts/:path*', destination: '/transactions', permanent: false },
      { source: '/payments', destination: '/transactions', permanent: false },
      { source: '/payments/:path*', destination: '/transactions', permanent: false },
    ];
  },
};

export default nextConfig;
