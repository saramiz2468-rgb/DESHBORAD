import { expect, test } from '@playwright/test';

const WEB = 'http://localhost:3000';
const APP_ROUTES = [
  '/today',
  '/calendar',
  '/log',
  '/halacha',
  '/insights',
  '/import',
  '/support',
  '/settings',
];

test.describe('web – Hebrew, RTL, mobile-first', () => {
  for (const route of ['/', '/login', '/legal/privacy', ...APP_ROUTES]) {
    test(`${route} renders in Hebrew RTL without horizontal scroll`, async ({ page }) => {
      const res = await page.goto(WEB + route);
      expect(res?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', 'he');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(page.locator('h1').first()).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('every app screen is visibly marked as not active yet', async ({ page }) => {
    for (const route of APP_ROUTES) {
      await page.goto(WEB + route);
      await expect(page.getByText('תצוגת מבנה בלבד')).toBeVisible();
      await expect(page.getByText('מתוכנן').first()).toBeVisible();
      // No inputs exist on planned screens – nothing can be entered or "saved".
      await expect(page.locator('main input, main textarea, main select')).toHaveCount(0);
    }
  });

  test('halacha screen states that calculations are inactive and not a ruling', async ({
    page,
  }) => {
    await page.goto(WEB + '/halacha');
    await expect(page.getByText('החישובים ההלכתיים עדיין לא פעילים')).toBeVisible();
    await expect(page.locator('main').getByText('גורם הלכתי מוסמך').first()).toBeVisible();
    await expect(page.locator('main').getByText('לא פסק הלכה').first()).toBeVisible();
  });

  test('login and purchase are disabled', async ({ page }) => {
    await page.goto(WEB + '/login');
    await expect(page.locator('fieldset input')).toBeDisabled();
    await expect(page.locator('fieldset button')).toBeDisabled();
    await page.goto(WEB + '/');
    await expect(page.getByRole('button', { name: 'הרכישה תיפתח בקרוב' })).toBeDisabled();
  });
});

test.describe('web – security headers', () => {
  test('pages carry a nonce CSP and strict headers', async ({ request }) => {
    const res = await request.get(WEB + '/');
    const h = res.headers();
    expect(h['content-security-policy']).toMatch(
      /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/,
    );
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['referrer-policy']).toBe('no-referrer');
    expect(h['permissions-policy']).toContain('geolocation=()');
    expect(h['strict-transport-security']).toContain('max-age=');
    expect(h['x-powered-by']).toBeUndefined();
  });

  test('a new nonce is issued per request', async ({ request }) => {
    const a = (await request.get(WEB + '/')).headers()['content-security-policy'];
    const b = (await request.get(WEB + '/')).headers()['content-security-policy'];
    expect(a).not.toBe(b);
  });

  for (const route of [...APP_ROUTES, '/login']) {
    test(`${route} is never cacheable`, async ({ request }) => {
      const cc = (await request.get(WEB + route)).headers()['cache-control'] ?? '';
      expect(cc).toContain('no-store');
      expect(cc).toContain('private');
    });
  }

  test('service worker script is always revalidated', async ({ request }) => {
    const cc = (await request.get(WEB + '/sw.js')).headers()['cache-control'] ?? '';
    expect(cc).toContain('no-store');
  });
});

test.describe('web – CSP does not break the app', () => {
  test('no console errors or CSP violations, and client navigation works', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(WEB + '/today');
    await page.waitForLoadState('networkidle');
    // Client-side navigation only works if the nonce'd scripts executed (hydration).
    await page.locator('nav a[href="/calendar"]:visible').first().click();
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(page.locator('h1')).toHaveText('לוח שנה');
    expect(errors).toEqual([]);
  });
});
