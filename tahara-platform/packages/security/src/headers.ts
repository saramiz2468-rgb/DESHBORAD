/** Static security headers applied to every response (see next.config.ts of each app). */
export interface HeaderEntry {
  key: string;
  value: string;
}

export const baseSecurityHeaders: readonly HeaderEntry[] = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    // Precise location is never requested: the user picks a city instead.
    value:
      'geolocation=(), camera=(), microphone=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=(), browsing-topics=(), interest-cohort=()',
  },
];

/** Responses that may contain personal data must never be stored by any cache. */
export const PRIVATE_NO_STORE = 'private, no-store, max-age=0, must-revalidate';

/** Admin system is never indexed. */
export const ADMIN_ROBOTS = 'noindex, nofollow, noarchive';
