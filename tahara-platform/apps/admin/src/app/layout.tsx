import '@fontsource-variable/heebo';
import '@fontsource-variable/frank-ruhl-libre';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { default: 'ניהול · TAHARA', template: '%s · ניהול TAHARA' },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#fbf7f3' };

export default async function RootLayout({ children }: { children: ReactNode }) {
  await connection();
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
