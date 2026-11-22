import { expect, test } from '@playwright/test';

const WEB = 'http://localhost:3000';
const ALLOWED = [/^\/_next\/static\//, /^\/offline\.html$/, /^\/icons\/[\w.-]+$/];

test('service worker and browser storage never hold pages or personal data', async ({ page }) => {
  await page.goto(WEB + '/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Reload so the now-active worker controls the page, then browse the private area.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  for (const r of ['/today', '/calendar', '/halacha', '/settings', '/login', '/legal/privacy']) {
    await page.goto(WEB + r);
    await page.waitForLoadState('networkidle');
  }

  const audit = await page.evaluate(async () => {
    const names = await caches.keys();
    const urls: string[] = [];
    for (const n of names) {
      const c = await caches.open(n);
      for (const req of await c.keys())
        urls.push(new URL(req.url).pathname + new URL(req.url).search);
    }
    const dbs = 'databases' in indexedDB ? await indexedDB.databases() : [];
    return { names, urls, ls: localStorage.length, ss: sessionStorage.length, dbs: dbs.length };
  });

  expect(audit.names).toEqual(['tahara-static-v1']);
  expect(audit.urls.length).toBeGreaterThan(0);
  for (const u of audit.urls) {
    const path = u.split('?')[0] ?? u;
    expect(
      ALLOWED.some((re) => re.test(path)),
      `unexpected cached URL: ${u}`,
    ).toBe(true);
  }
  expect(audit.ls).toBe(0);
  expect(audit.ss).toBe(0);
  expect(audit.dbs).toBe(0);
});

test('offline navigation shows the static offline page, not a cached private page', async ({
  page,
  context,
}) => {
  await page.goto(WEB + '/today');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.goto(WEB + '/today').catch(() => {});
  await expect(page.getByRole('heading', { name: 'אין חיבור לרשת' })).toBeVisible();
  await context.setOffline(false);
});
