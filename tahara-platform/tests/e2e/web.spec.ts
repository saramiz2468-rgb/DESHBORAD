import { expect, test, type Page } from '@playwright/test';

const WEB = 'http://localhost:3000';
const APP_ROUTES = [
  '/today',
  '/calendar',
  '/track',
  '/tahara',
  '/tahara/vestot',
  '/more',
  '/fertility',
  '/stats',
  '/history',
  '/reminders',
  '/settings',
  '/privacy',
  '/support',
];

async function scenario(page: Page, label: string) {
  await page.getByLabel('תרחיש:').selectOption({ label });
}

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

  test('every app screen shows the demo-mode label', async ({ page }) => {
    for (const route of APP_ROUTES) {
      await page.goto(WEB + route);
      await expect(page.getByRole('region', { name: 'מצב הדגמה' })).toContainText('נמחקים ברענון');
    }
  });

  test('new user starts empty – no demo data unless a scenario is chosen', async ({ page }) => {
    await page.goto(WEB + '/today');
    await expect(page.getByRole('heading', { name: 'ברוכה הבאה' })).toBeVisible();
    await expect(page.getByText('נתוני הדגמה, לא נתונים אמיתיים')).toHaveCount(0);
    await scenario(page, 'מעקב מחזור');
    await expect(page.getByText('מוצגים נתוני הדגמה, לא נתונים אמיתיים')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'המחזור שלי' })).toBeVisible();
  });

  test('vestot: no halachic calculation is shown', async ({ page }) => {
    await page.goto(WEB + '/tahara/vestot');
    await expect(page.getByText('החישובים עדיין לא פעילים')).toBeVisible();
    await expect(page.locator('main').getByText('גורם הלכתי מוסמך').first()).toBeVisible();
    await expect(page.getByText('לא פעיל', { exact: true })).toHaveCount(5);
  });

  test('login and purchase stay disabled', async ({ page }) => {
    await page.goto(WEB + '/login');
    await expect(page.locator('fieldset input')).toBeDisabled();
    await page.goto(WEB + '/');
    await expect(page.getByRole('button', { name: 'הרכישה תיפתח בקרוב' })).toBeDisabled();
  });
});

test.describe('web – interactive simulation', () => {
  test('recording a period updates home; edit; delete with undo', async ({ page }) => {
    await page.goto(WEB + '/today');
    await page.getByRole('button', { name: 'תיעוד המחזור האחרון' }).click();
    const dialog = page.getByRole('dialog', { name: 'תיעוד מחזור' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('radio', { name: 'בינוני' }).click();
    await dialog.getByRole('button', { name: 'כאבי גב' }).click();
    await dialog.getByRole('button', { name: 'שמירת מחזור' }).click();
    await expect(page.getByText('המחזור נשמר')).toBeVisible();
    await expect(page.getByRole('img', { name: 'יום 1 במחזור' })).toBeVisible();

    // In-memory data survives client-side navigation (and is cleared by a full reload).
    await page.locator('nav a[href="/track"]:visible').first().click();
    await expect(page.getByText('בינוני')).toBeVisible();
    await page.getByRole('button', { name: /עריכת המחזור/ }).click();
    const edit = page.getByRole('dialog', { name: 'עריכת מחזור' });
    await edit.getByRole('button', { name: 'מחיקה' }).click();
    await page
      .getByRole('dialog', { name: 'מחיקת מחזור' })
      .getByRole('button', { name: 'מחיקה' })
      .click();
    await expect(page.getByRole('heading', { name: 'עדיין אין מחזורים' })).toBeVisible();
    await page.getByRole('button', { name: 'ביטול' }).click();
    await expect(page.getByText('בינוני')).toBeVisible();
  });

  test('validation: a future start date is rejected', async ({ page }) => {
    await page.goto(WEB + '/track');
    await page.getByRole('button', { name: 'מחזור חדש' }).click();
    const dialog = page.getByRole('dialog', { name: 'תיעוד מחזור' });
    await dialog.getByLabel('תחילת הדימום').fill('2099-01-01');
    await dialog.getByRole('button', { name: 'שמירת מחזור' }).click();
    await expect(dialog.getByRole('alert')).toContainText('עתידי');
  });

  test('seven clean days: documenting a check is recorded, never ruled on', async ({ page }) => {
    await page.goto(WEB + '/tahara');
    await scenario(page, 'בשבעה נקיים');
    await expect(page.getByText('תיעדת 3 מתוך 7 ימים')).toBeVisible();
    await page
      .getByRole('button', { name: /ערב.*הוספת תיעוד/ })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: 'תיעוד בדיקה' });
    await expect(dialog.getByText('אינה קובעת אם היום נחשב')).toBeVisible();
    await dialog.getByRole('button', { name: 'שמירה' }).click();
    await expect(page.getByText('הבדיקה תועדה')).toBeVisible();
  });

  test('checklist: add a personal task and tick it', async ({ page }) => {
    await page.goto(WEB + '/tahara');
    await scenario(page, 'בשבעה נקיים');
    await page.getByLabel('משימה חדשה').fill('בדיקת שיניים');
    await page.getByRole('button', { name: 'הוספה', exact: true }).click();
    const box = page.getByRole('checkbox', { name: 'בדיקת שיניים' });
    await box.check();
    await expect(box).toBeChecked();
  });

  test('calendar: switch display, open a day, add from the calendar', async ({ page }) => {
    await page.goto(WEB + '/calendar');
    await scenario(page, 'מעקב מחזור');
    await page.getByRole('radio', { name: 'עברי' }).click();
    await page.getByRole('button', { name: 'החודש הבא' }).click();
    await page.getByRole('button', { name: 'היום', exact: true }).click();
    await page.locator('table button').filter({ hasText: /\S/ }).nth(10).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'מקרא' })).toBeVisible();
  });

  test('settings: date display preference changes dates across the app', async ({ page }) => {
    await page.goto(WEB + '/settings');
    await page.getByRole('radio', { name: 'לועזי' }).click();
    await page.locator('nav a[href="/today"]:visible').first().click();
    const sub = page.locator('header p').first();
    await expect(sub).not.toContainText('·');
  });

  test('export produces a JSON download (no storage)', async ({ page }) => {
    await page.goto(WEB + '/privacy');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'הורדה' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^tahara-export-\d{4}-\d{2}-\d{2}\.json$/);
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
    await page.locator('nav a[href="/calendar"]:visible').first().click();
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(page.locator('h1')).toHaveText('לוח שנה');
    expect(errors).toEqual([]);
  });
});

test('a full reload clears all simulated data (nothing persisted)', async ({ page }) => {
  await page.goto(WEB + '/today');
  await page.getByLabel('תרחיש:').selectOption({ label: 'מעקב מחזור' });
  await expect(page.getByRole('heading', { name: 'המחזור שלי' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'ברוכה הבאה' })).toBeVisible();
});
