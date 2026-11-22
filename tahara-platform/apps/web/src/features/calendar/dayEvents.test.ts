import { describe, expect, it } from 'vitest';
import { predict } from '@tahara/core/medical-engine';
import { emptyData } from '@/state/defaults';
import { dayInfo } from './dayEvents';

const today = '2026-11-22';

describe('dayInfo', () => {
  const data = {
    ...emptyData(),
    periods: [
      { id: 'z', start: '2026-09-19', end: '2026-09-23', symptoms: [] },
      { id: 'a', start: '2026-10-17', end: '2026-10-21', symptoms: [] },
      { id: 'b', start: '2026-11-14', end: '2026-11-18', symptoms: [] },
    ],
    hefseks: [{ id: 'h', date: '2026-11-18', performed: true }],
    bedikot: [
      {
        id: 'x',
        hefsekId: 'h',
        day: 1,
        part: 'morning' as const,
        date: '2026-11-19',
        result: 'clean' as const,
      },
    ],
    tevilot: [{ id: 't', hefsekId: 'h', planned: '2026-11-25', done: false }],
  };
  const p = predict(data.periods, today);

  it('marks recorded bleeding, hefsek, documented checks and planned tevila', () => {
    expect([...dayInfo('2026-11-16', data, p, today).kinds]).toContain('bleed');
    expect([...dayInfo('2026-11-18', data, p, today).kinds]).toEqual(
      expect.arrayContaining(['bleed', 'hefsek']),
    );
    expect([...dayInfo('2026-11-19', data, p, today).kinds]).toContain('clean');
    expect([...dayInfo('2026-11-25', data, p, today).kinds]).toContain('tevila');
  });

  it('marks estimates only in the future, and never vestot', () => {
    expect(p.nextStart).toBe('2026-12-12');
    expect([...dayInfo('2026-12-12', data, p, today).kinds]).toContain('expected');
    for (let d = 1; d <= 30; d++) {
      const date = `2026-11-${String(d).padStart(2, '0')}`;
      expect(dayInfo(date, data, p, today).kinds.has('veset')).toBe(false);
    }
  });
});
