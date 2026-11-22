import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  diffDays,
  formatDate,
  formatGregorian,
  formatHebrew,
  gematria,
  isISODate,
  isTime,
  jerusalemNow,
  monthGrid,
  toHebrewDate,
  todayInJerusalem,
  weekday,
} from './index';

describe('ISO dates', () => {
  it('validates real calendar days only', () => {
    expect(isISODate('2024-02-29')).toBe(true);
    expect(isISODate('2025-02-29')).toBe(false);
    expect(isISODate('2025-13-01')).toBe(false);
    expect(isISODate('2025-1-01')).toBe(false);
    expect(isISODate(20250101)).toBe(false);
  });

  it('adds and diffs days across leap days and year ends', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(diffDays('2024-01-01', '2025-01-01')).toBe(366);
  });

  it('is unaffected by Israeli daylight-saving transitions', () => {
    // DST 2026: starts Fri 27 Mar, ends Sun 25 Oct.
    expect(diffDays('2026-03-26', '2026-03-28')).toBe(2);
    expect(diffDays('2026-10-24', '2026-10-26')).toBe(2);
    expect(addDays('2026-03-27', 1)).toBe('2026-03-28');
    expect(addDays('2026-10-25', -1)).toBe('2026-10-24');
  });

  it('returns the Jerusalem calendar day, not UTC', () => {
    // 22:30 UTC on 26 Mar 2026 = 00:30 IST on 27 Mar.
    expect(todayInJerusalem(new Date('2026-03-26T22:30:00Z'))).toBe('2026-03-27');
    // 21:30 UTC on 24 Oct 2026 = 00:30 IDT on 25 Oct.
    expect(todayInJerusalem(new Date('2026-10-24T21:30:00Z'))).toBe('2026-10-25');
    // 21:30 UTC on 25 Oct 2026 = 23:30 IST, still 25 Oct.
    expect(jerusalemNow(new Date('2026-10-25T21:30:00Z'))).toEqual({
      date: '2026-10-25',
      minutes: 23 * 60 + 30,
    });
  });

  it('knows weekdays', () => {
    expect(weekday('2026-11-22')).toBe(0); // Sunday
    expect(weekday('2026-11-28')).toBe(6); // Saturday
  });

  it('adds months and builds Sunday-first month grids', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-01');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-01');
    const grid = monthGrid('2026-11-22');
    expect(grid[0]![0]).toBe('2026-11-01'); // 1 Nov 2026 is a Sunday
    expect(grid.every((w) => w.length === 7 && weekday(w[0]!) === 0)).toBe(true);
    expect(grid.flat()).toContain('2026-11-30');
  });

  it('validates times', () => {
    expect(isTime('07:05')).toBe(true);
    expect(isTime('24:00')).toBe(false);
    expect(isTime('7:05')).toBe(false);
  });
});

describe('Hebrew numerals', () => {
  it.each([
    [1, 'א׳'],
    [10, 'י׳'],
    [11, 'י״א'],
    [15, 'ט״ו'],
    [16, 'ט״ז'],
    [20, 'כ׳'],
    [30, 'ל׳'],
    [5785, 'תשפ״ה'],
    [5787, 'תשפ״ז'],
    [5784, 'תשפ״ד'],
    [5715, 'תשט״ו'],
    [5716, 'תשט״ז'],
  ])('%i → %s', (n, s) => expect(gematria(n)).toBe(s));

  it('rejects non-positive values', () => {
    expect(() => gematria(0)).toThrow();
    expect(() => gematria(1.5)).toThrow();
  });
});

describe('Hebrew calendar', () => {
  it('converts known dates', () => {
    expect(formatHebrew('2024-10-03')).toBe('א׳ בתשרי תשפ״ה'); // Rosh Hashana 5785
    expect(formatHebrew('2025-03-14')).toBe('י״ד באדר תשפ״ה'); // Purim, common year
    expect(formatHebrew('2026-11-22', { year: false })).toBe('י״ב בכסלו');
  });

  it('distinguishes Adar I / Adar II in leap years', () => {
    expect(toHebrewDate('2024-02-10').month).toBe('אדר א׳');
    expect(toHebrewDate('2024-03-24')).toEqual({ day: 14, month: 'אדר ב׳', year: 5784 });
  });

  it('formats by user preference', () => {
    expect(formatDate('2026-11-22', 'gregorian')).toBe('22 בנובמבר 2026');
    expect(formatDate('2026-11-22', 'hebrew', { year: false })).toBe('י״ב בכסלו');
    expect(formatDate('2026-11-22', 'both', { year: false, weekday: true })).toBe(
      'יום ראשון, י״ב בכסלו · 22 בנובמבר',
    );
    expect(formatGregorian('2026-11-22', { weekday: true })).toBe('יום ראשון, 22 בנובמבר 2026');
  });
});
