import '@fontsource-variable/heebo';
import '@fontsource-variable/frank-ruhl-libre';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import type { ReactNode } from 'react';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { publicEnv } from '@/lib/env';

export const metadata: Metadata = {
  ...(publicEnv.NEXT_PUBLIC_SITE_URL
    ? { metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL) }
    : {}),
  title: { default: 'TAHARA', template: '%s · TAHARA' },
  description: 'יומן אישי ומאובטח למעקב אחר מחזור, טהרת המשפחה ופוריות.',
  applicationName: 'TAHARA',
  appleWebApp: { capable: true, title: 'TAHARA', statusBarStyle: 'default' },
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  // Stage 1 skeleton – not for search engines yet.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf7f3' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1519' },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Per-request rendering is required for the CSP nonce (see proxy.ts).
  await connection();
  return (
    <html lang="he" dir="rtl">
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
