/** Hebrew-month arithmetic built on toHebrewDate (Intl). No halachic meaning. */
import { addDays, type ISODate } from './dates';
import { toHebrewDate } from './format';

const key = (d: ISODate) => {
  const h = toHebrewDate(d);
  return `${h.year}|${h.month}`;
};

export function sameHebrewMonth(a: ISODate, b: ISODate): boolean {
  return key(a) === key(b);
}

export function startOfHebrewMonth(date: ISODate): ISODate {
  return addDays(date, -(toHebrewDate(date).day - 1));
}

export function nextHebrewMonthStart(date: ISODate): ISODate {
  let d = startOfHebrewMonth(date);
  d = addDays(d, 28);
  while (sameHebrewMonth(d, date)) d = addDays(d, 1);
  return d;
}

export function hebrewMonthLength(date: ISODate): 29 | 30 {
  const start = startOfHebrewMonth(date);
  return sameHebrewMonth(addDays(start, 29), start) ? 30 : 29;
}

/** The month after the month of `date`, `n` months ahead (n ≥ 1). */
export function hebrewMonthStartAfter(date: ISODate, n: number): ISODate {
  let d = date;
  for (let i = 0; i < n; i++) d = nextHebrewMonthStart(d);
  return d;
}

export interface SameDayResult {
  date: ISODate | null;
  /** Month name of the target month (for messages when the day is missing). */
  monthName: string;
}

/** Same Hebrew day-of-month, `n` months later. `date: null` if that month lacks the day (30th). */
export function sameHebrewDayMonthsLater(date: ISODate, n = 1): SameDayResult {
  const day = toHebrewDate(date).day;
  const start = hebrewMonthStartAfter(date, n);
  const monthName = toHebrewDate(start).month;
  if (day > hebrewMonthLength(start)) return { date: null, monthName };
  return { date: addDays(start, day - 1), monthName };
}

/** Whole Hebrew months from the month of a to the month of b (0 = same month). */
export function hebrewMonthsBetween(a: ISODate, b: ISODate, max = 24): number | null {
  if (b < a) return null;
  let d = a;
  for (let i = 0; i <= max; i++) {
    if (sameHebrewMonth(d, b)) return i;
    d = nextHebrewMonthStart(d);
  }
  return null;
}

/** Rosh Chodesh: the 30th of a full month or the 1st of a month (Rosh Hashana excluded). */
export function isRoshChodesh(date: ISODate): boolean {
  const h = toHebrewDate(date);
  if (h.day === 30) return true;
  return h.day === 1 && h.month !== 'תשרי';
}
