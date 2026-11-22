import { isISODate, toDayNumber, weekday, type ISODate } from './dates';

const DAY_MS = 86_400_000;

export const GREGORIAN_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
] as const;
export const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] as const;
export const WEEKDAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'] as const;

export type DateDisplay = 'hebrew' | 'gregorian' | 'both';

/* ---------------- Gregorian ---------------- */

export function formatGregorian(
  s: ISODate,
  opts: { year?: boolean; weekday?: boolean } = {},
): string {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number];
  let out = `${d} ב${GREGORIAN_MONTHS[m - 1]}`;
  if (opts.year !== false) out += ` ${y}`;
  if (opts.weekday) out = `יום ${WEEKDAYS[weekday(s)]}, ${out}`;
  return out;
}

export function formatGregorianShort(s: ISODate): string {
  const [y, m, d] = s.split('-');
  return `${Number(d)}.${Number(m)}.${y!.slice(2)}`;
}

export function formatGregorianMonth(s: ISODate): string {
  const [y, m] = s.split('-').map(Number) as [number, number];
  return `${GREGORIAN_MONTHS[m - 1]} ${y}`;
}

/* ---------------- Hebrew numerals ---------------- */

const LETTERS: ReadonlyArray<[number, string]> = [
  [400, 'ת'],
  [300, 'ש'],
  [200, 'ר'],
  [100, 'ק'],
  [90, 'צ'],
  [80, 'פ'],
  [70, 'ע'],
  [60, 'ס'],
  [50, 'נ'],
  [40, 'מ'],
  [30, 'ל'],
  [20, 'כ'],
  [10, 'י'],
  [9, 'ט'],
  [8, 'ח'],
  [7, 'ז'],
  [6, 'ו'],
  [5, 'ה'],
  [4, 'ד'],
  [3, 'ג'],
  [2, 'ב'],
  [1, 'א'],
];

/** Hebrew numeral with geresh/gershayim. 15 → ט״ו, 16 → ט״ז, 5787 → תשפ״ז (thousands dropped). */
export function gematria(value: number): string {
  if (!Number.isInteger(value) || value <= 0)
    throw new RangeError(`gematria needs a positive integer, got ${value}`);
  let n = value % 1000;
  let s = '';
  while (n > 0) {
    // 15 and 16 are written ט״ו / ט״ז to avoid spelling the divine name.
    if (n === 15 || n === 16) {
      s += n === 15 ? 'טו' : 'טז';
      break;
    }
    for (const [v, c] of LETTERS) {
      if (n >= v) {
        s += c;
        n -= v;
        break;
      }
    }
  }
  if (!s) return '';
  return s.length === 1 ? `${s}׳` : `${s.slice(0, -1)}״${s.slice(-1)}`;
}

/* ---------------- Hebrew calendar (via Intl) ---------------- */

export interface HebrewDate {
  day: number;
  month: string;
  year: number;
}

let hebrewFmt: Intl.DateTimeFormat | null = null;
function fmt(): Intl.DateTimeFormat {
  hebrewFmt ??= new Intl.DateTimeFormat('he-u-ca-hebrew', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return hebrewFmt;
}

const cache = new Map<string, HebrewDate>();

export function toHebrewDate(s: ISODate): HebrewDate {
  if (!isISODate(s)) throw new RangeError(`Invalid ISO date: ${s}`);
  const hit = cache.get(s);
  if (hit) return hit;
  const parts: Record<string, string> = {};
  for (const p of fmt().formatToParts(new Date(toDayNumber(s) * DAY_MS + 12 * 3_600_000)))
    parts[p.type] = p.value;
  const r: HebrewDate = {
    day: Number(parts.day),
    month: parts.month ?? '',
    year: Number(parts.year),
  };
  if (!r.day || !r.month || !r.year)
    throw new Error('Hebrew calendar is not supported in this environment');
  cache.set(s, r);
  return r;
}

export function formatHebrew(s: ISODate, opts: { year?: boolean } = {}): string {
  const h = toHebrewDate(s);
  let out = `${gematria(h.day)} ב${h.month}`;
  if (opts.year !== false) out += ` ${gematria(h.year)}`;
  return out;
}

export function formatHebrewDay(s: ISODate): string {
  return gematria(toHebrewDate(s).day);
}

export function formatHebrewMonth(s: ISODate): string {
  const h = toHebrewDate(s);
  return `${h.month} ${gematria(h.year)}`;
}

/* ---------------- Combined, by user preference ---------------- */

export function formatDate(
  s: ISODate,
  display: DateDisplay,
  opts: { year?: boolean; weekday?: boolean } = {},
): string {
  const g = formatGregorian(s, opts);
  if (display === 'gregorian') return g;
  const h = formatHebrew(s, { year: opts.year !== false });
  const wd = opts.weekday ? `יום ${WEEKDAYS[weekday(s)]}, ` : '';
  if (display === 'hebrew') return `${wd}${h}`;
  return `${wd}${h} · ${formatGregorian(s, { year: opts.year !== false })}`;
}
