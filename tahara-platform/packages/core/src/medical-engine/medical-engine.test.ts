import { describe, expect, it } from 'vitest';
import { addDays } from '../calendar';
import { bleedLength, cycleStats, cycles, predict, validatePeriod } from './index';

const P = (start: string, end?: string) => ({ start, end });

describe('cycles and stats', () => {
  it('computes start-to-start lengths and bleed days', () => {
    const ps = [P('2026-07-01', '2026-07-05'), P('2026-07-29', '2026-08-02'), P('2026-08-28')];
    expect(cycles(ps).map((c) => c.length)).toEqual([28, 30]);
    expect(bleedLength(ps[0]!)).toBe(5);
    expect(bleedLength({ start: '2026-07-01', bleedDays: 4 })).toBe(4);
    expect(bleedLength({ start: '2026-07-01' })).toBeNull();
  });

  it('ignores implausible gaps (missing records) and sorts input', () => {
    const ps = [P('2026-08-28'), P('2026-01-01'), P('2026-07-29'), P('2026-07-01')];
    const s = cycleStats(ps);
    expect(s.lengths).toEqual([28, 30]); // 181-day gap excluded
    expect(s.averageLength).toBe(29);
    expect(s.shortest).toBe(28);
    expect(s.longest).toBe(30);
  });

  it('flags irregular cycles', () => {
    const starts = ['2026-01-01', '2026-01-25', '2026-03-04', '2026-04-04', '2026-05-19'];
    expect(cycleStats(starts.map((s) => P(s))).irregular).toBe(true);
    const regular = ['2026-01-01', '2026-01-29', '2026-02-27', '2026-03-27'];
    expect(cycleStats(regular.map((s) => P(s))).irregular).toBe(false);
  });
});

describe('predict', () => {
  const today = '2026-11-22';

  it('returns nothing without any period', () => {
    expect(predict([], today).basis).toBe('none');
  });

  it('with one period and no declared length: only day of cycle', () => {
    const r = predict([P('2026-11-14', '2026-11-18')], today);
    expect(r.basis).toBe('none');
    expect(r.dayOfCycle).toBe(9);
    expect(r.nextStart).toBeNull();
  });

  it('falls back to the declared cycle length', () => {
    const r = predict([P('2026-11-14')], today, { declaredCycleLength: 30 });
    expect(r.basis).toBe('declared');
    expect(r.nextStart).toBe('2026-12-14');
    expect(r.ovulation).toBe('2026-11-30');
    expect(r.fertileWindow).toEqual(['2026-11-25', '2026-12-01']);
    expect(r.daysUntilOvulation).toBe(8);
  });

  it('uses history once two plausible cycles exist', () => {
    const r = predict([P('2026-09-19'), P('2026-10-17'), P('2026-11-14')], today, {
      declaredCycleLength: 35,
    });
    expect(r.basis).toBe('history');
    expect(r.cycleLength).toBe(28);
    expect(r.nextStart).toBe('2026-12-12');
    expect(r.nextStartRange).toEqual(['2026-12-10', '2026-12-14']);
    expect(r.ovulationSource).toBe('calendar');
  });

  it('prefers a positive ovulation test in the current cycle', () => {
    const r = predict([P('2026-09-19'), P('2026-10-17'), P('2026-11-01')], today, {}, [
      { date: '2026-10-25', result: 'positive' }, // previous cycle – ignored
      { date: '2026-11-13', result: 'negative' },
      { date: '2026-11-15', result: 'positive' },
    ]);
    expect(r.ovulation).toBe('2026-11-16');
    expect(r.ovulationSource).toBe('lh');
  });

  it('reports a late period after the range has passed', () => {
    const r = predict([P('2026-08-20'), P('2026-09-17'), P('2026-10-15')], today);
    expect(r.nextStart).toBe('2026-11-12');
    expect(r.late).toBe(true);
  });

  it('ignores future-dated periods', () => {
    expect(predict([P(addDays(today, 3))], today).basis).toBe('none');
  });
});

describe('validatePeriod', () => {
  const existing = [{ id: 'a', start: '2026-10-17', end: '2026-10-21' }];
  const today = '2026-11-22';

  it('accepts a valid new period', () => {
    expect(validatePeriod({ start: '2026-11-14', end: '2026-11-18' }, existing, today)).toEqual([]);
  });
  it('rejects future, reversed, duplicate and overlapping periods', () => {
    expect(validatePeriod({ start: '2026-11-30' }, existing, today)[0]?.field).toBe('start');
    expect(
      validatePeriod({ start: '2026-11-14', end: '2026-11-10' }, existing, today)[0]?.field,
    ).toBe('end');
    expect(validatePeriod({ start: '2026-10-17' }, existing, today)[0]?.message).toContain(
      'כבר רשום',
    );
    expect(validatePeriod({ start: '2026-10-19' }, existing, today)[0]?.message).toContain(
      'חופפים',
    );
  });
  it('allows editing a period in place', () => {
    expect(
      validatePeriod({ start: '2026-10-17', end: '2026-10-22' }, existing, today, 'a'),
    ).toEqual([]);
  });
});
