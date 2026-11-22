import path from 'node:path';
import type { NextConfig } from 'next';
import { ADMIN_ROBOTS, baseSecurityHeaders } from '@tahara/security';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@tahara/ui', '@tahara/security'],
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  turbopack: { root: path.join(import.meta.dirname, '../..') },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...baseSecurityHeaders, { key: 'X-Robots-Tag', value: ADMIN_ROBOTS }],
      },
    ];
  },
};

export default config;
