import { describe, expect, it } from 'vitest';
import type { Bedika } from '@/domain/types';
import { taharaStatus } from './tracking';

const base = { periods: [], hefseks: [], bedikot: [], tevilot: [] };
const today = '2026-11-22';
const period = { id: 'p', start: '2026-11-10', end: '2026-11-15', symptoms: [] };
const hefsek = { id: 'h', date: '2026-11-15', performed: true };
const bedika = (day: number, part: Bedika['part'], date: string): Bedika => ({
  id: `${day}${part}`,
  hefsekId: 'h',
  day,
  part,
  date,
  result: 'clean',
});

describe('taharaStatus (documentation only)', () => {
  it('is empty with no records', () => {
    expect(taharaStatus(base, today).stage).toBe('none');
  });

  it('distinguishes ongoing bleeding from an ended period without hefsek', () => {
    expect(taharaStatus({ ...base, periods: [{ ...period, end: undefined }] }, today).stage).toBe(
      'bleeding',
    );
    expect(taharaStatus({ ...base, periods: [period] }, today).stage).toBe('awaiting-hefsek');
  });

  it('counts documented day slots without inferring anything', () => {
    const s = taharaStatus(
      {
        ...base,
        periods: [period],
        hefseks: [hefsek],
        bedikot: [
          bedika(1, 'morning', '2026-11-16'),
          bedika(1, 'evening', '2026-11-16'),
          bedika(3, 'morning', '2026-11-18'),
        ],
      },
      today,
    );
    expect(s.stage).toBe('seven-days');
    expect(s.documentedDays).toBe(2);
    expect(s.remainingToDocument).toBe(5);
    expect(s.slots[0]?.date).toBe('2026-11-16');
    expect(s.slots[1]?.date).toBeUndefined(); // never auto-filled
  });

  it('marks all seven documented and after tevila only from user records', () => {
    const all = Array.from({ length: 7 }, (_, i) => bedika(i + 1, 'morning', `2026-11-${16 + i}`));
    expect(
      taharaStatus({ ...base, periods: [period], hefseks: [hefsek], bedikot: all }, today).stage,
    ).toBe('all-documented');
    expect(
      taharaStatus(
        {
          ...base,
          periods: [period],
          hefseks: [hefsek],
          bedikot: all,
          tevilot: [{ id: 't', hefsekId: 'h', done: true }],
        },
        today,
      ).stage,
    ).toBe('after-tevila');
  });

  it('ignores a hefsek recorded before the latest period', () => {
    const s = taharaStatus(
      { ...base, periods: [period], hefseks: [{ ...hefsek, date: '2026-10-01' }] },
      today,
    );
    expect(s.hefsek).toBeNull();
    expect(s.stage).toBe('awaiting-hefsek');
  });
});
