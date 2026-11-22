import path from 'node:path';
import type { NextConfig } from 'next';
import { baseSecurityHeaders } from '@tahara/security';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@tahara/ui', '@tahara/security', '@tahara/core'],
  // Monorepo root, so Vercel/Turbopack trace files from packages/*.
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  turbopack: { root: path.join(import.meta.dirname, '../..') },
  async headers() {
    return [
      { source: '/:path*', headers: [...baseSecurityHeaders] },
      {
        // The service worker must always be revalidated so policy fixes ship immediately.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default config;
