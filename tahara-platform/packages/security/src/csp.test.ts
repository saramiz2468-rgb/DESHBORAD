import { describe, expect, it } from 'vitest';
import { buildCsp, createNonce } from './csp';
import { baseSecurityHeaders } from './headers';

const nonce = 'AAAAAAAAAAAAAAAAAAAAAA==';

describe('buildCsp', () => {
  it('requires a nonce for scripts and forbids framing/objects in production', () => {
    const csp = buildCsp({ nonce, isDev: false });
    expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`);
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it('allows eval and websockets only in development', () => {
    const csp = buildCsp({ nonce, isDev: true });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain('ws:');
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('accepts only https origins in connect-src', () => {
    expect(buildCsp({ nonce, isDev: false, connectSrc: ['https://x.supabase.co'] })).toContain(
      "connect-src 'self' https://x.supabase.co",
    );
    expect(() => buildCsp({ nonce, isDev: false, connectSrc: ['http://evil.test'] })).toThrow();
    expect(() =>
      buildCsp({ nonce, isDev: false, connectSrc: ['https://a.test; script-src *'] }),
    ).toThrow();
  });

  it('rejects weak or malformed nonces', () => {
    expect(() => buildCsp({ nonce: 'short', isDev: false })).toThrow();
    expect(() => buildCsp({ nonce: "x' 'unsafe-inline", isDev: false })).toThrow();
  });
});

describe('createNonce', () => {
  it('produces unique 128-bit values', () => {
    const a = createNonce();
    const b = createNonce();
    expect(a).not.toBe(b);
    expect(atob(a)).toHaveLength(16);
  });
});

describe('baseSecurityHeaders', () => {
  it('disables geolocation (city selection instead of GPS)', () => {
    const pp = baseSecurityHeaders.find((h) => h.key === 'Permissions-Policy');
    expect(pp?.value).toContain('geolocation=()');
  });
});
