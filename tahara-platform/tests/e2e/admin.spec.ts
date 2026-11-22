import { expect, test } from '@playwright/test';

const ADMIN = 'http://localhost:3001';
const LOCKED = 'http://localhost:3002';
const MODULES = [
  '/dashboard',
  '/purchases',
  '/revenue',
  '/users',
  '/entitlements',
  '/refunds',
  '/coupons',
  '/support',
  '/audit',
];

test.describe('admin – locked by default', () => {
  for (const p of ['/', '/dashboard', '/users', '/login']) {
    test(`${p} returns 404 when preview is not enabled`, async ({ request }) => {
      const res = await request.get(LOCKED + p, { maxRedirects: 0 });
      expect(res.status()).toBe(404);
      expect(res.headers()['x-robots-tag']).toContain('noindex');
      expect(res.headers()['cache-control']).toContain('no-store');
    });
  }
});

test.describe('admin – skeleton (preview enabled)', () => {
  for (const p of MODULES) {
    test(`${p} renders with no data and the privacy boundary`, async ({ page }) => {
      const res = await page.goto(ADMIN + p);
      expect(res?.status()).toBe(200);
      expect(res?.headers()['x-robots-tag']).toContain('noindex');
      expect(res?.headers()['cache-control']).toContain('no-store');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(page.getByText('נתונים אמיתיים או לדוגמה')).toBeVisible();
      await expect(page.getByText('גבול הפרטיות')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('dashboard shows no numbers (no fake metrics)', async ({ page }) => {
    await page.goto(ADMIN + '/dashboard');
    const text = (await page.locator('main').innerText()).replace(/שלב \d+/g, '');
    expect(text).not.toMatch(/\d/);
  });

  test('admin login is disabled', async ({ page }) => {
    await page.goto(ADMIN + '/login');
    await expect(page.locator('fieldset input')).toBeDisabled();
    await expect(page.locator('fieldset button')).toBeDisabled();
  });
});

test('admin: no console errors or CSP violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(ADMIN + '/dashboard');
  await page.waitForLoadState('networkidle');
  await page.locator('nav a[href="/users"]:visible').first().click();
  await expect(page).toHaveURL(/\/users$/);
  expect(errors).toEqual([]);
});
