import { addDays, diffDays, type ISODate } from '../calendar';
import { cycleStats, RECENT_CYCLES, MIN_CYCLES_FOR_HISTORY, sortByStart } from './cycles';
import type { EngineSettings, OvulationTestInput, PeriodInput, Prediction } from './types';

export const DEFAULT_LUTEAL_DAYS = 14;
/** Fertile window: 5 days before estimated ovulation through 1 day after. */
export const FERTILE_BEFORE = 5;
export const FERTILE_AFTER = 1;

const EMPTY: Prediction = {
  basis: 'none',
  lastStart: null,
  dayOfCycle: null,
  cycleLength: null,
  nextStart: null,
  nextStartRange: null,
  ovulation: null,
  ovulationSource: null,
  fertileWindow: null,
  daysUntilNext: null,
  daysUntilOvulation: null,
  irregular: false,
  late: false,
};

/**
 * Estimates only. Never a diagnosis and never suitable as contraception.
 * Uses recorded history when there are at least MIN_CYCLES_FOR_HISTORY
 * plausible cycles; otherwise falls back to the cycle length the user declared.
 */
export function predict(
  periods: readonly PeriodInput[],
  today: ISODate,
  settings: EngineSettings = {},
  ovulationTests: readonly OvulationTestInput[] = [],
): Prediction {
  const sorted = sortByStart(periods.filter((p) => p.start <= today));
  const last = sorted.at(-1);
  if (!last) return EMPTY;

  const stats = cycleStats(sorted, { recent: settings.method === 'recent3' ? 3 : RECENT_CYCLES });
  let basis: Prediction['basis'] = 'none';
  let cycleLength: number | null = null;
  if (stats.count >= MIN_CYCLES_FOR_HISTORY && stats.averageLength) {
    basis = 'history';
    cycleLength = Math.round(stats.averageLength);
  } else if (
    settings.declaredCycleLength &&
    settings.declaredCycleLength >= 15 &&
    settings.declaredCycleLength <= 60
  ) {
    basis = 'declared';
    cycleLength = settings.declaredCycleLength;
  }

  const dayOfCycle = diffDays(last.start, today) + 1;
  if (basis === 'none' || cycleLength === null) {
    return { ...EMPTY, lastStart: last.start, dayOfCycle };
  }

  const nextStart = addDays(last.start, cycleLength);
  const margin = basis === 'history' ? Math.max(2, Math.ceil((stats.spread ?? 0) / 2)) : 3;
  const luteal = settings.lutealDays ?? DEFAULT_LUTEAL_DAYS;

  const positiveLh = ovulationTests
    .filter((t) => t.result === 'positive' && t.date >= last.start && t.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1))[0];
  const ovulation = positiveLh ? addDays(positiveLh.date, 1) : addDays(nextStart, -luteal);
  const ovulationOk = diffDays(last.start, ovulation) > 0;

  return {
    basis,
    lastStart: last.start,
    dayOfCycle,
    cycleLength,
    nextStart,
    nextStartRange: [addDays(nextStart, -margin), addDays(nextStart, margin)],
    ovulation: ovulationOk ? ovulation : null,
    ovulationSource: ovulationOk ? (positiveLh ? 'lh' : 'calendar') : null,
    fertileWindow: ovulationOk
      ? [addDays(ovulation, -FERTILE_BEFORE), addDays(ovulation, FERTILE_AFTER)]
      : null,
    daysUntilNext: diffDays(today, nextStart),
    daysUntilOvulation: ovulationOk ? diffDays(today, ovulation) : null,
    irregular: stats.irregular,
    late: diffDays(nextStart, today) > margin,
  };
}
