import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

interface SwPolicy {
  CACHE_VERSION: string;
  PRECACHE_URLS: string[];
  isCacheable(url: string, method: string, origin: string): boolean;
}

function loadPolicy(): SwPolicy {
  const src = readFileSync(fileURLToPath(new URL('../public/sw.js', import.meta.url)), 'utf8');
  const self: Record<string, unknown> = { addEventListener: () => {} };
  vm.runInNewContext(src, { self, URL, caches: {}, fetch: () => {} });
  return self.__TAHARA_SW__ as SwPolicy;
}

const O = 'https://app.tahara.example';
const policy = loadPolicy();

describe('service worker cache policy', () => {
  it('caches hashed build assets and the static offline shell', () => {
    expect(policy.isCacheable(`${O}/_next/static/chunks/main-abc.js`, 'GET', O)).toBe(true);
    expect(policy.isCacheable(`${O}/_next/static/media/heebo.woff2`, 'GET', O)).toBe(true);
    expect(policy.isCacheable(`${O}/offline.html`, 'GET', O)).toBe(true);
    expect(policy.isCacheable(`${O}/icons/icon-192.png`, 'GET', O)).toBe(true);
  });

  it.each([
    '/',
    '/today',
    '/calendar',
    '/halacha',
    '/settings',
    '/import',
    '/support',
    '/login',
    '/auth/callback?code=x',
    '/api/webhooks/payments',
    '/today?_rsc=1',
    '/manifest.webmanifest',
    '/offline.html?x=1',
    '/icons/../today',
  ])('never caches %s', (path) => {
    expect(policy.isCacheable(`${O}${path}`, 'GET', O)).toBe(false);
  });

  it('never caches cross-origin requests (e.g. Supabase)', () => {
    expect(policy.isCacheable('https://xyz.supabase.co/rest/v1/med_periods', 'GET', O)).toBe(false);
    expect(policy.isCacheable('https://cdn.example/_next/static/a.js', 'GET', O)).toBe(false);
  });

  it('never caches non-GET requests', () => {
    expect(policy.isCacheable(`${O}/_next/static/a.js`, 'POST', O)).toBe(false);
  });

  it('precaches only public static files', () => {
    for (const u of policy.PRECACHE_URLS) expect(u).toMatch(/^\/(offline\.html|icons\/[\w.-]+)$/);
  });
});
