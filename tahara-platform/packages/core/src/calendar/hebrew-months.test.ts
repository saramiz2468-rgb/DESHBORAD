import { describe, expect, it } from 'vitest';
import { formatHebrew, toHebrewDate } from './format';
import {
  hebrewMonthLength,
  hebrewMonthsBetween,
  isRoshChodesh,
  nextHebrewMonthStart,
  sameHebrewDayMonthsLater,
  startOfHebrewMonth,
} from './hebrew-months';

describe('Hebrew months', () => {
  it('fixed month lengths', () => {
    expect(hebrewMonthLength('2024-10-03')).toBe(30); // Tishrei 5785
    expect(hebrewMonthLength('2025-01-05')).toBe(29); // Tevet 5785
    expect(hebrewMonthLength('2024-02-10')).toBe(30); // Adar I 5784
    expect(hebrewMonthLength('2024-03-24')).toBe(29); // Adar II 5784
    expect(hebrewMonthLength('2025-03-14')).toBe(29); // Adar 5785 (common year)
  });

  it('Cheshvan/Kislev vary by year (full vs deficient)', () => {
    expect(toHebrewDate('2024-12-26').month).toBe('כסלו');
    expect(hebrewMonthLength('2024-12-26')).toBe(30); // Kislev 5785 – full
    expect(hebrewMonthLength('2024-11-15')).toBe(30); // Cheshvan 5785 – full
    expect(hebrewMonthLength('2025-11-01')).toBe(29); // Cheshvan 5786 – deficient
  });

  it('finds month boundaries', () => {
    expect(formatHebrew(startOfHebrewMonth('2026-11-23'), { year: false })).toBe('א׳ בכסלו');
    expect(toHebrewDate(nextHebrewMonthStart('2026-11-23'))).toMatchObject({
      day: 1,
      month: 'טבת',
    });
  });

  it('same day next month, including Adar I → Adar II', () => {
    const r = sameHebrewDayMonthsLater('2024-02-24'); // 15 Adar I 5784
    expect(r.date && formatHebrew(r.date)).toBe('ט״ו באדר ב׳ תשפ״ד');
  });

  it('reports a missing 30th', () => {
    const k30 = '2024-12-31'; // 30 Kislev 5785
    expect(toHebrewDate(k30).day).toBe(30);
    expect(sameHebrewDayMonthsLater(k30)).toEqual({ date: null, monthName: 'טבת' });
  });

  it('counts months between dates', () => {
    expect(hebrewMonthsBetween('2024-02-24', '2024-03-25')).toBe(1);
    expect(hebrewMonthsBetween('2024-10-03', '2024-12-26')).toBe(2);
  });

  it('detects Rosh Chodesh', () => {
    expect(isRoshChodesh('2024-12-31')).toBe(true); // 30 Kislev
    expect(isRoshChodesh('2025-01-01')).toBe(true); // 1 Tevet
    expect(isRoshChodesh('2024-10-03')).toBe(false); // 1 Tishrei = Rosh Hashana
  });
});
