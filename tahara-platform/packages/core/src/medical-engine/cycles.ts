import { addDays, diffDays, type ISODate } from '../calendar';
import type { CycleStats, PeriodInput } from './types';

/** Intervals longer than this are treated as missing records, not cycles. */
export const MAX_PLAUSIBLE_CYCLE = 90;
export const MIN_PLAUSIBLE_CYCLE = 10;
/** History needed before the engine relies on it instead of declared values. */
export const MIN_CYCLES_FOR_HISTORY = 2;
/** Spread (longest − shortest) above which cycles are considered irregular. */
export const IRREGULAR_SPREAD = 9;
export const RECENT_CYCLES = 6;

export function sortByStart<T extends PeriodInput>(periods: readonly T[]): T[] {
  return [...periods].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

/** Bleeding days, inclusive of start and end. */
export function bleedLength(p: PeriodInput): number | null {
  if (p.end && p.end >= p.start) return diffDays(p.start, p.end) + 1;
  if (p.bleedDays && p.bleedDays > 0) return p.bleedDays;
  return null;
}

/** The last day of bleeding, if known. */
export function bleedEnd(p: PeriodInput): ISODate | null {
  if (p.end && p.end >= p.start) return p.end;
  if (p.bleedDays && p.bleedDays > 0) return addDays(p.start, p.bleedDays - 1);
  return null;
}

export interface Cycle {
  start: ISODate;
  nextStart: ISODate;
  length: number;
  plausible: boolean;
}

/** Start-to-start cycles between consecutive recorded periods. */
export function cycles(periods: readonly PeriodInput[]): Cycle[] {
  const sorted = sortByStart(periods);
  const out: Cycle[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1]!;
    const b = sorted[i]!;
    const length = diffDays(a.start, b.start);
    out.push({
      start: a.start,
      nextStart: b.start,
      length,
      plausible: length >= MIN_PLAUSIBLE_CYCLE && length <= MAX_PLAUSIBLE_CYCLE,
    });
  }
  return out;
}

const mean = (xs: readonly number[]) =>
  xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
const round1 = (x: number | null) => (x === null ? null : Math.round(x * 10) / 10);

export function cycleStats(
  periods: readonly PeriodInput[],
  opts: { recent?: number } = {},
): CycleStats {
  const all = cycles(periods)
    .filter((c) => c.plausible)
    .map((c) => c.length);
  const lengths = opts.recent ? all.slice(-opts.recent) : all;
  const bleeds = sortByStart(periods)
    .map(bleedLength)
    .filter((x): x is number => x !== null);
  const shortest = lengths.length ? Math.min(...lengths) : null;
  const longest = lengths.length ? Math.max(...lengths) : null;
  const spread = shortest !== null && longest !== null ? longest - shortest : null;
  return {
    count: lengths.length,
    lengths,
    averageLength: round1(mean(lengths)),
    shortest,
    longest,
    averageBleed: round1(mean(opts.recent ? bleeds.slice(-(opts.recent + 1)) : bleeds)),
    spread,
    irregular: lengths.length >= 3 && spread !== null && spread > IRREGULAR_SPREAD,
  };
}

/** Periods whose start falls in [from, to]. */
export function periodsBetween<T extends PeriodInput>(
  periods: readonly T[],
  from: ISODate,
  to: ISODate,
): T[] {
  return sortByStart(periods).filter((p) => p.start >= from && p.start <= to);
}

export interface PeriodValidationIssue {
  field: 'start' | 'end' | 'bleedDays';
  message: string;
}

/** Validation for a new or edited period against existing ones. */
export function validatePeriod(
  input: PeriodInput,
  existing: ReadonlyArray<PeriodInput & { id: string }>,
  today: ISODate,
  editingId?: string,
): PeriodValidationIssue[] {
  const issues: PeriodValidationIssue[] = [];
  if (input.start > today)
    issues.push({ field: 'start', message: 'תאריך ההתחלה לא יכול להיות עתידי' });
  if (input.end) {
    if (input.end < input.start)
      issues.push({ field: 'end', message: 'תאריך הסיום לא יכול להיות לפני תאריך ההתחלה' });
    else if (diffDays(input.start, input.end) + 1 > 20)
      issues.push({ field: 'end', message: 'משך דימום של יותר מ-20 יום. כדאי לבדוק את התאריכים' });
    if (input.end > today)
      issues.push({ field: 'end', message: 'תאריך הסיום לא יכול להיות עתידי' });
  }
  if (input.bleedDays !== undefined && (input.bleedDays < 1 || input.bleedDays > 20)) {
    issues.push({ field: 'bleedDays', message: 'מספר ימי הדימום צריך להיות בין 1 ל-20' });
  }
  const end = bleedEnd(input) ?? input.start;
  for (const p of existing) {
    if (p.id === editingId) continue;
    if (p.start === input.start) {
      issues.push({ field: 'start', message: 'כבר רשום מחזור שמתחיל בתאריך הזה' });
      break;
    }
    const pEnd = bleedEnd(p) ?? p.start;
    if (input.start <= pEnd && end >= p.start) {
      issues.push({ field: 'start', message: 'התאריכים חופפים למחזור קיים' });
      break;
    }
  }
  return issues;
}
