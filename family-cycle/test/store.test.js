import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, KEY_PLAIN, KEY_ENC } from '../store.js';
import { addDays } from '../calc.js';

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

const T = '2026-11-20';

test('פתיחה ראשונה ושמירה במכשיר', async () => {
  const storage = memoryStorage();
  const s = createStore({ storage });
  assert.equal(s.init(), 'new');
  await s.completeOnboarding({ motherName: 'רחל' });
  const d = await s.addDaughter({ name: 'נועה', birthDate: '2011-03-02' }, T);
  await s.addCycle(d.id, { start: addDays(T, -30), end: addDays(T, -26), notes: 'הערה' }, T);

  // טעינה מחדש (כמו פתיחה חוזרת של האפליקציה)
  const s2 = createStore({ storage });
  assert.equal(s2.init(), 'ready');
  assert.equal(s2.get().motherName, 'רחל');
  assert.equal(s2.getDaughter(d.id).cycles[0].notes, 'הערה');
});

test('הפרדה בין בנות ומניעת כפילויות', async () => {
  const s = createStore({ storage: memoryStorage() });
  s.init();
  await s.completeOnboarding({ motherName: '', today: T });
  const a = await s.addDaughter({ name: 'א' }, T);
  const b = await s.addDaughter({ name: 'ב' }, T);
  const start = addDays(T, -40);
  const c1 = await s.addCycle(a.id, { start, end: addDays(start, 4) }, T);
  await s.addCycle(b.id, { start }, T); // אותו תאריך לבת אחרת – מותר
  await assert.rejects(s.addCycle(a.id, { start }, T), /כבר קיים/);
  await assert.rejects(s.addCycle(a.id, { start: addDays(start, 2) }, T), /חופפים/);
  await s.addCycle(a.id, { start: addDays(start, 28) }, T); // רשומה חדשה, לא דורסת
  assert.equal(s.getDaughter(a.id).cycles.length, 2);
  assert.equal(s.getDaughter(b.id).cycles.length, 1);
  // מחזור של בת אחת לא נגיש דרך בת אחרת
  await assert.rejects(s.updateCycle(b.id, c1.id, { notes: 'x' }, T), /לא נמצאה/);
  await assert.rejects(s.deleteCycle(b.id, c1.id), /לא נמצאה/);
  await s.updateCycle(a.id, c1.id, { notes: 'עודכן' }, T);
  assert.equal(s.getDaughter(a.id).cycles[0].notes, 'עודכן');
  await s.deleteDaughter(a.id);
  assert.throws(() => s.getDaughter(a.id), /לא נמצא/);
  assert.equal(s.getDaughter(b.id).cycles.length, 1);
});

test('נעילה בקוד: הנתונים מוצפנים, קוד שגוי נדחה', async () => {
  const storage = memoryStorage();
  const s = createStore({ storage });
  s.init();
  await s.completeOnboarding({ motherName: 'דנה', today: T });
  const d = await s.addDaughter({ name: 'מאיה' }, T);
  await s.addCycle(d.id, { start: addDays(T, -3), notes: 'סוד' }, T);
  await s.setPin('2468');

  const raw = storage.dump();
  assert.equal(raw[KEY_PLAIN], undefined);
  assert.ok(raw[KEY_ENC]);
  assert.ok(!raw[KEY_ENC].includes('מאיה') && !raw[KEY_ENC].includes('סוד'));

  const s2 = createStore({ storage });
  assert.equal(s2.init(), 'locked');
  assert.ok(s2.isLocked());
  assert.throws(() => s2.listDaughters(), /נעולה/);
  assert.equal(await s2.unlock('1111'), false);
  assert.equal(await s2.unlock('2468'), true);
  assert.equal(s2.listDaughters()[0].name, 'מאיה');

  // שינוי אחרי פתיחה נשמר מוצפן
  await s2.addDaughter({ name: 'הדר' }, T);
  const s3 = createStore({ storage });
  s3.init();
  assert.equal(await s3.unlock('2468'), true);
  assert.equal(s3.listDaughters().length, 2);

  // נעילה ידנית וביטול קוד
  assert.ok(s3.lock());
  assert.ok(s3.isLocked());
  await s3.unlock('2468');
  await s3.disablePin();
  assert.ok(storage.dump()[KEY_PLAIN]);
  assert.equal(storage.dump()[KEY_ENC], undefined);
});

test('האפליקציה מתחילה ריקה, ופרופילי הדגמה ישנים נמחקים בלי לגעת בנתונים אמיתיים', async () => {
  const s = createStore({ storage: memoryStorage() });
  s.init();
  await s.completeOnboarding({ motherName: '' });
  assert.equal(s.listDaughters().length, 0);
  assert.equal(s.hasDemo(), false);
  // גיבוי ישן שכולל פרופיל הדגמה
  const old = { app: 'family-cycle', encrypted: false, data: { onboarded: true, nextId: 3, daughters: [
    { id: 1, name: 'הדגמה', isDemo: true, cycles: [{ id: 2, start: '2026-10-01', isDemo: true }] },
    { id: 5, name: 'אמיתית', isDemo: false, cycles: [] },
  ] } };
  await s.importBackup(JSON.stringify(old), async () => null);
  assert.ok(s.hasDemo());
  assert.equal(await s.deleteDemo(), 1);
  assert.deepEqual(s.listDaughters().map((d) => d.name), ['אמיתית']);
});

test('גיבוי ושחזור, כולל גיבוי מוצפן', async () => {
  const src = createStore({ storage: memoryStorage() });
  src.init();
  await src.completeOnboarding({ motherName: 'רחל', today: T });
  const d = await src.addDaughter({ name: 'נועה' }, T);
  await src.addCycle(d.id, { start: addDays(T, -10) }, T);
  const plain = await src.exportBackup();
  await src.setPin('9876');
  const enc = await src.exportBackup();
  assert.ok(!enc.includes('נועה'));

  const dst = createStore({ storage: memoryStorage() });
  dst.init();
  await dst.completeOnboarding({ motherName: '', today: T });
  assert.equal(await dst.importBackup(plain, async () => null), true);
  assert.equal(dst.listDaughters()[0].cycles.length, 1);

  await dst.wipe();
  dst.init();
  await assert.rejects(dst.importBackup(enc, async () => '0000'), /שגוי/);
  assert.equal(await dst.importBackup(enc, async () => null), false);
  assert.equal(await dst.importBackup(enc, async () => '9876'), true);
  assert.equal(dst.get().motherName, 'רחל');
  // מזהים חדשים לא מתנגשים בקיימים אחרי שחזור
  const nd = await dst.addDaughter({ name: 'חדשה' }, T);
  assert.ok(nd.id > d.id);
  await assert.rejects(dst.importBackup('{"x":1}', async () => null), /אינו קובץ גיבוי/);
});

test('שמירה שנכשלה (אחסון מלא) לא משאירה מצב חלקי', async () => {
  const storage = memoryStorage();
  const s = createStore({ storage });
  s.init();
  await s.completeOnboarding({ motherName: '', today: T });
  storage.setItem = () => { throw new Error('QuotaExceeded'); };
  await assert.rejects(s.addDaughter({ name: 'x' }, T), /השמירה נכשלה/);
  assert.equal(s.listDaughters().length, 0);
});
