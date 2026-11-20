import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server.js';
import { addDays, fromDay } from '../public/calc.js';

let server, base, dataDir, store;
const today = fromDay(Math.floor(Date.now() / 86400000));

before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-test-'));
  const app = createApp({ dataDir });
  store = app.store;
  server = http.createServer(app.handler);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

function client() {
  let cookie = '';
  return async (method, url, body, extraHeaders = {}) => {
    const res = await fetch(base + url, {
      method,
      headers: {
        'X-Requested-With': 'fetch',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...extraHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: res.status, data: await res.json().catch(() => null), headers: res.headers };
  };
}

test('הרשמה, כניסה והגנות בסיסיות', async () => {
  const mom = client();
  assert.equal((await mom('GET', '/api/daughters')).status, 401);
  const reg = await mom('POST', '/api/auth/register', { name: 'רחל', email: 'Rachel@Example.com', password: 'secret-pass-1' });
  assert.equal(reg.status, 201);
  assert.match(reg.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  assert.equal((await mom('GET', '/api/me')).data.user.email, 'rachel@example.com');

  const dupe = await client()('POST', '/api/auth/register', { name: 'x', email: 'rachel@example.com', password: 'another-pass' });
  assert.equal(dupe.status, 409);
  assert.equal((await client()('POST', '/api/auth/login', { email: 'rachel@example.com', password: 'wrong-pass' })).status, 401);
  const good = client();
  assert.equal((await good('POST', '/api/auth/login', { email: 'RACHEL@example.com', password: 'secret-pass-1' })).status, 200);

  // בקשה משנה בלי כותרת ה-CSRF נחסמת
  const res = await fetch(base + '/api/daughters', { method: 'POST', body: '{}' });
  assert.equal(res.status, 403);

  await mom('POST', '/api/auth/logout');
  assert.equal((await mom('GET', '/api/me')).data.user, null);
  assert.equal((await mom('GET', '/api/daughters')).status, 401);
});

test('הפרדה מלאה בין משתמשות ובין בנות + מניעת כפילויות', async () => {
  const a = client();
  const b = client();
  await a('POST', '/api/auth/register', { name: 'אמא א', email: 'a@x.co', password: 'password-a' });
  await b('POST', '/api/auth/register', { name: 'אמא ב', email: 'b@x.co', password: 'password-b' });

  const d1 = (await a('POST', '/api/daughters', { name: 'נועה', birthDate: '2011-03-02' })).data.daughter;
  const d2 = (await a('POST', '/api/daughters', { name: 'מאיה' })).data.daughter;
  const s = addDays(today, -40);
  const c1 = await a('POST', `/api/daughters/${d1.id}/cycles`, { start: s, end: addDays(s, 4), notes: 'הערה פרטית' });
  assert.equal(c1.status, 201);
  // אותו תאריך לבת אחרת – מותר, כי המעקב נפרד
  assert.equal((await a('POST', `/api/daughters/${d2.id}/cycles`, { start: s })).status, 201);
  // כפילות ובחפיפה לאותה בת – נחסם
  const dup = await a('POST', `/api/daughters/${d1.id}/cycles`, { start: s });
  assert.equal(dup.status, 422);
  assert.equal((await a('POST', `/api/daughters/${d1.id}/cycles`, { start: addDays(s, 2) })).status, 422);
  // מחזור חדש יוצר רשומה חדשה ולא דורס
  assert.equal((await a('POST', `/api/daughters/${d1.id}/cycles`, { start: addDays(s, 28), end: addDays(s, 32) })).status, 201);
  const detail = await a('GET', `/api/daughters/${d1.id}`);
  assert.equal(detail.data.cycles.length, 2);
  assert.equal(detail.data.cycles[0].notes, 'הערה פרטית');

  // רשימת הכרטיסים לא כוללת הערות
  const list = await a('GET', '/api/daughters');
  assert.equal(list.data.daughters.length, 2);
  assert.equal(list.data.daughters[0].cycles[0].notes, undefined);

  // משתמשת אחרת לא רואה ולא יכולה לגעת
  assert.equal((await b('GET', '/api/daughters')).data.daughters.length, 0);
  assert.equal((await b('GET', `/api/daughters/${d1.id}`)).status, 404);
  assert.equal((await b('PUT', `/api/daughters/${d1.id}`, { name: 'x' })).status, 404);
  assert.equal((await b('DELETE', `/api/daughters/${d1.id}/cycles/${c1.data.cycle.id}`)).status, 404);
  assert.equal((await b('POST', `/api/daughters/${d1.id}/cycles`, { start: today })).status, 404);
  // מחזור של בת אחת לא נגיש דרך נתיב של בת אחרת
  assert.equal((await a('PUT', `/api/daughters/${d2.id}/cycles/${c1.data.cycle.id}`, { notes: 'x' })).status, 404);

  // עריכה ומחיקה
  const upd = await a('PUT', `/api/daughters/${d1.id}/cycles/${c1.data.cycle.id}`, { end: addDays(s, 5), notes: 'עודכן' });
  assert.equal(upd.status, 200);
  assert.equal(upd.data.cycle.end, addDays(s, 5));
  assert.equal((await a('DELETE', `/api/daughters/${d1.id}/cycles/${c1.data.cycle.id}`)).status, 200);
  assert.equal((await a('DELETE', `/api/daughters/${d1.id}`)).status, 200);
  assert.equal((await a('GET', `/api/daughters/${d1.id}`)).status, 404);
});

test('הנתונים הרגישים מוצפנים במסד הנתונים', async () => {
  const rows = store.db.prepare('SELECT data FROM cycles UNION ALL SELECT data FROM daughters').all();
  assert.ok(rows.length > 0);
  for (const r of rows) {
    assert.match(r.data, /^v1\./);
    assert.ok(!r.data.includes('מאיה') && !r.data.includes(today.slice(0, 4) + '-'));
  }
});

test('נתוני הדגמה: טעינה ומחיקה בלי לגעת בנתונים אמיתיים', async () => {
  const m = client();
  await m('POST', '/api/auth/register', { name: 'דנה', email: 'demo@x.co', password: 'password-d', demo: true });
  let list = (await m('GET', '/api/daughters')).data;
  assert.equal(list.hasDemo, true);
  assert.equal(list.daughters.length, 3);
  await m('POST', '/api/daughters', { name: 'אמיתית' });
  assert.equal((await m('POST', '/api/demo')).status, 409);
  assert.equal((await m('DELETE', '/api/demo')).data.removed, 3);
  list = (await m('GET', '/api/daughters')).data;
  assert.deepEqual(list.daughters.map((d) => d.name), ['אמיתית']);
  assert.equal(list.hasDemo, false);
});

test('הגבלת ניסיונות התחברות', async () => {
  const c = client();
  await c('POST', '/api/auth/register', { name: 'ל', email: 'rate@x.co', password: 'password-r' });
  let last;
  for (let i = 0; i < 9; i++) last = await client()('POST', '/api/auth/login', { email: 'rate@x.co', password: 'nope-nope' });
  assert.equal(last.status, 429);
});

test('קבצים סטטיים וכותרות אבטחה', async () => {
  const res = await fetch(base + '/');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal((await fetch(base + '/..%2fserver.js')).status, 403);
});
