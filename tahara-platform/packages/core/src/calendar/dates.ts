/**
 * Calendar-day arithmetic on plain 'YYYY-MM-DD' strings.
 *
 * A date is a calendar day in Asia/Jerusalem, never an instant. Arithmetic is
 * done on whole UTC day numbers, so daylight-saving transitions (23/25-hour
 * days) can never shift a count.
 */
export type ISODate = string & { readonly __brand?: 'ISODate' };

export const TIME_ZONE = 'Asia/Jerusalem';
const DAY_MS = 86_400_000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string') return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

function assertDate(s: string): void {
  if (!isISODate(s)) throw new RangeError(`Invalid ISO date: ${s}`);
}

/** Whole days since 1970-01-01. */
export function toDayNumber(s: ISODate): number {
  assertDate(s);
  const [y, m, d] = s.split('-').map(Number) as [number, number, number];
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNumber(n: number): ISODate {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(s: ISODate, days: number): ISODate {
  return fromDayNumber(toDayNumber(s) + days);
}

/** b − a in whole days. */
export function diffDays(a: ISODate, b: ISODate): number {
  return toDayNumber(b) - toDayNumber(a);
}

export function compareDates(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isBetween(d: ISODate, from: ISODate, to: ISODate): boolean {
  return d >= from && d <= to;
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(s: ISODate): number {
  return new Date(toDayNumber(s) * DAY_MS).getUTCDay();
}

const jerusalemParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Calendar date and minutes-after-midnight in Jerusalem for an instant. */
export function jerusalemNow(now: Date = new Date()): { date: ISODate; minutes: number } {
  const p: Record<string, string> = {};
  for (const part of jerusalemParts.formatToParts(now)) p[part.type] = part.value;
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: (Number(p.hour) % 24) * 60 + Number(p.minute),
  };
}

export function todayInJerusalem(now: Date = new Date()): ISODate {
  return jerusalemNow(now).date;
}

export function startOfMonth(s: ISODate): ISODate {
  return `${s.slice(0, 7)}-01`;
}

export function addMonths(s: ISODate, months: number): ISODate {
  const [y, m] = s.split('-').map(Number) as [number, number];
  const idx = y * 12 + (m - 1) + months;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return `${String(ny).padStart(4, '0')}-${String(nm).padStart(2, '0')}-01`;
}

/**
 * Weeks (Sunday-first) covering the Gregorian month of `anyDayInMonth`.
 * Days outside the month are included to fill whole weeks.
 */
export function monthGrid(anyDayInMonth: ISODate): ISODate[][] {
  const first = startOfMonth(anyDayInMonth);
  const last = addDays(addMonths(first, 1), -1);
  const start = addDays(first, -weekday(first));
  const end = addDays(last, 6 - weekday(last));
  const weeks: ISODate[][] = [];
  for (let d = start; d <= end; d = addDays(d, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)));
  }
  return weeks;
}

/** Valid 'HH:MM' (24h). */
export function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
