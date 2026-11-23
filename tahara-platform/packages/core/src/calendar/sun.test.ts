import { describe, expect, it } from 'vitest';
import { cityById, CITIES } from './cities';
import { formatMinutes, jerusalemOffsetMinutes, parseTime, sunTimes } from './sun';

const J = cityById('jerusalem');
const within = (min: number, hhmm: string, tol = 3) => Math.abs(min - parseTime(hhmm)!) <= tol;

describe('sun times (sea level)', () => {
  it('Jerusalem, summer solstice (IDT, UTC+3)', () => {
    const s = sunTimes('2026-06-21', J.lat, J.lng);
    expect(within(s.sunrise, '05:34')).toBe(true);
    expect(within(s.sunset, '19:48')).toBe(true);
  });

  it('Jerusalem, winter solstice (IST, UTC+2)', () => {
    const s = sunTimes('2026-12-21', J.lat, J.lng);
    expect(within(s.sunrise, '06:36')).toBe(true);
    expect(within(s.sunset, '16:39')).toBe(true);
  });

  it('jumps by an hour across the DST change, not the sun', () => {
    expect(jerusalemOffsetMinutes('2026-03-26')).toBe(120);
    expect(jerusalemOffsetMinutes('2026-03-27')).toBe(180);
    const before = sunTimes('2026-03-26', J.lat, J.lng).sunset;
    const after = sunTimes('2026-03-27', J.lat, J.lng).sunset;
    expect(Math.round(after - before)).toBeGreaterThanOrEqual(59);
    expect(Math.round(after - before)).toBeLessThanOrEqual(62);
  });

  it('differs between cities (west sets later than east)', () => {
    const tlv = cityById('tel-aviv');
    const d = '2026-11-23';
    expect(sunTimes(d, tlv.lat, tlv.lng).sunset).toBeGreaterThan(sunTimes(d, J.lat, J.lng).sunset);
    const eilat = cityById('eilat');
    expect(sunTimes('2026-06-21', eilat.lat, eilat.lng).sunset).toBeLessThan(
      sunTimes('2026-06-21', cityById('kiryat-shmona').lat, cityById('kiryat-shmona').lng).sunset,
    );
  });

  it('formats and parses times', () => {
    expect(formatMinutes(16 * 60 + 39.4)).toBe('16:39');
    expect(parseTime('7:05')).toBeNull();
    expect(parseTime('19:48')).toBe(19 * 60 + 48);
  });

  it('has unique city ids with Israeli coordinates', () => {
    expect(new Set(CITIES.map((c) => c.id)).size).toBe(CITIES.length);
    for (const c of CITIES) {
      expect(c.lat).toBeGreaterThan(29);
      expect(c.lat).toBeLessThan(33.5);
    }
  });
});
