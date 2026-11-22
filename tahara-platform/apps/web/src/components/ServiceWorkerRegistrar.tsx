'use client';

import { useEffect } from 'react';

/** Registers /sw.js (static assets only – see public/sw.js). Production by default. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    const enabled =
      process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW_IN_DEV === 'true';
    if (!enabled || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* Offline support is optional; the app works without it. */
    });
  }, []);
  return null;
}
