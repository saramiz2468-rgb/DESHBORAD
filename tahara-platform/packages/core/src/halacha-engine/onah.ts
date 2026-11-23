import { addDays, formatMinutes, parseTime, sunTimes, type ISODate } from '../calendar';
import type { Location, Onah, ResolvedSighting, SightingInput, VesetEntry } from './types';

/** Minutes around sunrise/sunset in which the onah is treated as uncertain. */
export const TWILIGHT_BEFORE = 10;
export const TWILIGHT_AFTER = 30;

export function resolveSighting(s: SightingInput, loc: Location): ResolvedSighting {
  const base = { id: s.id, civilDate: s.date, source: s };
  const computable = s.kind === 'regular' && !(s.flags && s.flags.length);
  switch (s.onahMode) {
    case 'day':
      return { ...base, hdate: s.date, onah: 'day', nearTwilight: false, computable };
    case 'night-before-sunrise':
      return { ...base, hdate: s.date, onah: 'night', nearTwilight: false, computable };
    case 'night-after-sunset':
      return { ...base, hdate: addDays(s.date, 1), onah: 'night', nearTwilight: false, computable };
    case 'unknown':
      return { ...base, hdate: s.date, onah: null, nearTwilight: false, computable };
    case 'auto': {
      const t = parseTime(s.time);
      if (t === null)
        return { ...base, hdate: s.date, onah: null, nearTwilight: false, computable };
      const sun = sunTimes(s.date, loc.lat, loc.lng);
      const nearTwilight =
        (t >= sun.sunrise - TWILIGHT_AFTER && t <= sun.sunrise + TWILIGHT_BEFORE) ||
        (t >= sun.sunset - TWILIGHT_BEFORE && t <= sun.sunset + TWILIGHT_AFTER);
      if (t < sun.sunrise)
        return { ...base, hdate: s.date, onah: 'night', nearTwilight, computable };
      if (t >= sun.sunset)
        return { ...base, hdate: addDays(s.date, 1), onah: 'night', nearTwilight, computable };
      return { ...base, hdate: s.date, onah: 'day', nearTwilight, computable };
    }
  }
}

/** Civil window of an onah. Night of halachic day D = sunset of D−1 until sunrise of D. */
export function onahWindow(hdate: ISODate, onah: Onah, loc: Location): VesetEntry['window'] {
  if (onah === 'night') {
    const eve = addDays(hdate, -1);
    return {
      from: { date: eve, time: formatMinutes(sunTimes(eve, loc.lat, loc.lng).sunset) },
      to: { date: hdate, time: formatMinutes(sunTimes(hdate, loc.lat, loc.lng).sunrise) },
    };
  }
  const s = sunTimes(hdate, loc.lat, loc.lng);
  return {
    from: { date: hdate, time: formatMinutes(s.sunrise) },
    to: { date: hdate, time: formatMinutes(s.sunset) },
  };
}

/** The onah immediately before (used for the Ohr Zarua stringency). */
export function previousOnah(hdate: ISODate, onah: Onah): { hdate: ISODate; onah: Onah } {
  return onah === 'night' ? { hdate: addDays(hdate, -1), onah: 'day' } : { hdate, onah: 'night' };
}

export const ONAH_LABEL: Record<Onah, string> = { day: 'עונת יום', night: 'עונת לילה' };
