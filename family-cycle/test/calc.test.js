import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyze, validateCycle, bleedDays, diffDays, addDays, isValidDate, ageFrom,
} from '../calc.js';

test('ספירת ימים חוצה שעון קיץ וסוף שנה', () => {
  assert.equal(diffDays('2026-03-25', '2026-03-29'), 4); // מעבר לשעון קיץ בישראל
  assert.equal(diffDays('2026-10-23', '2026-10-27'), 4);
  assert.equal(diffDays('2025-12-30', '2026-01-02'), 3);
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2025-02-28', 1), '2025-03-01');
});

test('בדיקת תאריכים', () => {
  assert.ok(isValidDate('2024-02-29'));
  assert.ok(!isValidDate('2025-02-29'));
  assert.ok(!isValidDate('2025-13-01'));
  assert.ok(!isValidDate('01/02/2025'));
});

test('משך דימום כולל שני התאריכים', () => {
  assert.equal(bleedDays({ start: '2026-01-01', end: '2026-01-05' }), 5);
  assert.equal(bleedDays({ start: '2026-01-01', end: '2026-01-01' }), 1);
  assert.equal(bleedDays({ start: '2026-01-01', end: null }), null);
});

test('אורכי מחזור, ממוצעים ותחזית', () => {
  const cycles = [
    { id: 3, start: '2026-03-01', end: '2026-03-05' },
    { id: 1, start: '2026-01-01', end: '2026-01-05' },
    { id: 2, start: '2026-01-29', end: '2026-02-03' },
  ];
  const a = analyze(cycles, '2026-03-10');
  assert.deepEqual(a.rows.map((r) => r.id), [1, 2, 3]);
  assert.deepEqual(a.rows.map((r) => r.number), [1, 2, 3]);
  assert.deepEqual(a.rows.map((r) => r.length), [28, 31, null]);
  assert.deepEqual(a.rows.map((r) => r.sincePrev), [null, 28, 31]);
  assert.equal(a.avgCycle, 29.5);
  assert.equal(a.avgBleed, 5.3);
  assert.equal(a.status, 'between');
  assert.equal(a.cycleDay, 10);
  assert.equal(a.daysSinceStart, 9);
  assert.ok(a.enoughData);
  assert.equal(a.prediction.date, '2026-03-31'); // 1.3 + round(29.5)=30
  assert.equal(a.prediction.daysUntil, 21);
});

test('אין תחזית כשאין מספיק נתונים', () => {
  const a = analyze([{ id: 1, start: '2026-01-01', end: '2026-01-04' }, { id: 2, start: '2026-01-30', end: null }], '2026-02-02');
  assert.equal(a.prediction, null);
  assert.equal(a.neededForPrediction, 1);
  assert.equal(a.status, 'period'); // מחזור פתוח בן 4 ימים
  assert.ok(a.openEnded);
});

test('מרווח חריג (רישום חסר) לא נכנס לממוצע', () => {
  const a = analyze([
    { id: 1, start: '2025-01-01' }, { id: 2, start: '2025-01-29' },
    { id: 3, start: '2025-06-01' }, { id: 4, start: '2025-06-29' },
  ], '2025-07-01');
  assert.equal(a.avgCycle, 28);
});

test('סטטוס במחזור לפי תאריך סיום', () => {
  const c = [{ id: 1, start: '2026-05-01', end: '2026-05-05' }];
  assert.equal(analyze(c, '2026-05-05').status, 'period');
  assert.equal(analyze(c, '2026-05-06').status, 'between');
  assert.equal(analyze([], '2026-05-06').status, 'none');
});

test('מניעת כפילויות וחפיפות', () => {
  const existing = [
    { id: 1, start: '2026-01-01', end: '2026-01-05' },
    { id: 2, start: '2026-02-01', end: null },
  ];
  const t = '2026-03-01';
  assert.deepEqual(validateCycle({ start: '2026-02-20', end: '2026-02-24' }, existing, t), []);
  assert.match(validateCycle({ start: '2026-01-01' }, existing, t)[0], /כבר קיים/);
  assert.match(validateCycle({ start: '2026-01-03' }, existing, t)[0], /חופפים/);
  assert.match(validateCycle({ start: '2025-12-30', end: '2026-01-02' }, existing, t)[0], /חופפים/);
  assert.match(validateCycle({ start: '2026-01-31', end: '2026-02-02' }, existing, t)[0], /חופפים/);
  // עריכת רשומה קיימת לא מתנגשת בעצמה
  assert.deepEqual(validateCycle({ start: '2026-01-01', end: '2026-01-06' }, existing, t, 1), []);
  assert.match(validateCycle({ start: '2026-01-10', end: '2026-01-05' }, existing, t)[0], /לפני/);
  assert.match(validateCycle({ start: '2026-04-10' }, existing, t)[0], /בעתיד/);
  assert.match(validateCycle({ start: 'xx' }, existing, t)[0], /תקין/);
  assert.match(validateCycle({ start: '2026-02-10', end: '2026-02-28' }, existing, t)[0], /ארוך/);
});

test('חישוב גיל', () => {
  assert.equal(ageFrom('2010-05-10', '2026-05-09'), 15);
  assert.equal(ageFrom('2010-05-10', '2026-05-10'), 16);
  assert.equal(ageFrom(null, '2026-05-10'), null);
});
