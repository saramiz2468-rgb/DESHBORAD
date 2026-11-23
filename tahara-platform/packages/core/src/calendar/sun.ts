/**
 * Sea-level sunrise and sunset (NOAA solar-position algorithm, standard
 * refraction 0.833°). Astronomy only – no halachic meaning is assigned here.
 * Results are minutes after local midnight in Asia/Jerusalem.
 *
 * Accuracy: about ±1–2 minutes against published sea-level tables. Real
 * horizons and elevation differ, so times close to sunrise/sunset must always
 * be treated as uncertain by callers.
 */
import { isISODate, toDayNumber, type ISODate } from './dates';

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;

/** UTC offset of Asia/Jerusalem (minutes) at local noon of the date. */
export function jerusalemOffsetMinutes(date: ISODate): number {
  const d = new Date(toDayNumber(date) * DAY_MS + 12 * 3_600_000);
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem',
    timeZoneName: 'shortOffset',
  })
    .formatToParts(d)
    .find((p) => p.type === 'timeZoneName')?.value;
  const m = part?.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!m) return 120;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

export interface SunTimes {
  sunrise: number;
  sunset: number;
}

export function sunTimes(date: ISODate, lat: number, lng: number): SunTimes {
  if (!isISODate(date)) throw new RangeError(`Invalid ISO date: ${date}`);
  const jd = toDayNumber(date) + 2440587.5 + 0.5; // Julian day at 12:00 UTC
  const T = (jd - 2451545) / 36525;
  const L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C =
    Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * RAD) * 0.000289;
  const omega = 125.04 - 1934.136 * T;
  const appLong = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const meanObliq = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const obliq = meanObliq + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(obliq * RAD) * Math.sin(appLong * RAD));
  const y = Math.tan((obliq / 2) * RAD) ** 2;
  const eqTime =
    (4 / RAD) *
    (y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD));
  const cosHA =
    Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl)) -
    Math.tan(lat * RAD) * Math.tan(decl);
  const ha = Math.acos(Math.max(-1, Math.min(1, cosHA))) / RAD;
  const noonUtc = 720 - 4 * lng - eqTime;
  const off = jerusalemOffsetMinutes(date);
  return { sunrise: noonUtc - ha * 4 + off, sunset: noonUtc + ha * 4 + off };
}

export function formatMinutes(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function parseTime(t: string | undefined): number | null {
  if (!t || !/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) return null;
  const [h, m] = t.split(':').map(Number) as [number, number];
  return h * 60 + m;
}
