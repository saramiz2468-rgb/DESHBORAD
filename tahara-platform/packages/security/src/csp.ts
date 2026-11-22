/**
 * Content-Security-Policy builder shared by apps/web and apps/admin.
 *
 * Scripts are allowed only with a per-request nonce ('strict-dynamic'), so an
 * injected <script> without the nonce never runs. Inline style attributes are
 * still permitted because React/Next emit them; they cannot execute code.
 */
export interface CspOptions {
  nonce: string;
  isDev: boolean;
  /** Extra origins for connect-src (e.g. the Supabase project URL from stage 2). */
  connectSrc?: readonly string[];
}

export function buildCsp({ nonce, isDev, connectSrc = [] }: CspOptions): string {
  if (!/^[A-Za-z0-9+/=_-]{16,}$/.test(nonce)) {
    throw new Error('CSP nonce must be a base64 value of at least 16 characters');
  }
  for (const origin of connectSrc) {
    if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(origin)) {
      throw new Error(`connect-src origin must be an https origin, got: ${origin}`);
    }
  }

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...connectSrc, ...(isDev ? ['ws:'] : [])],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(' ')}`);
  if (!isDev) parts.push('upgrade-insecure-requests');
  return parts.join('; ');
}

/** 128-bit random nonce, base64 encoded. Works in the Edge and Node runtimes. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
