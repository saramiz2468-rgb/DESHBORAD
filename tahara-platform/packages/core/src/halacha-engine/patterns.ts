/**
 * Detects patterns that MAY establish a veset kavua. It never declares one:
 * establishing a fixed veset depends on conditions (three regular sightings,
 * matching onot, no intervening sightings, etc.) that a rabbi must confirm.
 */
import { diffDays, hebrewMonthsBetween, toHebrewDate, formatHebrew } from '../calendar';
import type { PatternCandidate, ResolvedSighting } from './types';

const sameOnah = (xs: ResolvedSighting[]) =>
  xs.every((x) => x.onah !== null && x.onah === xs[0]!.onah);
const ids = (xs: ResolvedSighting[]) => xs.map((x) => x.id);

export function detectPatterns(sorted: readonly ResolvedSighting[]): PatternCandidate[] {
  const out: PatternCandidate[] = [];
  const s = sorted.filter((x) => x.computable && x.onah);
  const intervals = s.slice(1).map((x, i) => diffDays(s[i]!.hdate, x.hdate) + 1);

  if (s.length >= 3) {
    const last3 = s.slice(-3);
    const d = last3.map((x) => toHebrewDate(x.hdate).day);
    const gaps = [
      hebrewMonthsBetween(last3[0]!.hdate, last3[1]!.hdate),
      hebrewMonthsBetween(last3[1]!.hdate, last3[2]!.hdate),
    ];
    if (d[0] === d[1] && d[1] === d[2] && gaps.every((g) => g === 1) && sameOnah(last3)) {
      out.push({
        kind: 'chodesh-kavua',
        label: 'דפוס של וסת החודש',
        description: `שלוש ראיות ב-${formatHebrew(last3[0]!.hdate, { year: false }).split(' ב')[0]} בחודש, בחודשים רצופים ובאותה עונה.`,
        sightings: ids(last3),
      });
    }
    if (d[0] === d[1] && d[1] === d[2] && gaps.every((g) => g === 2) && sameOnah(last3)) {
      out.push({
        kind: 'sirug',
        label: 'דפוס של וסת הסירוג',
        description: 'שלוש ראיות באותו יום בחודש, בהפרש של חודשיים זו מזו.',
        sightings: ids(last3),
      });
    }
    const step = d[1]! - d[0]!;
    if (step !== 0 && d[2]! - d[1]! === step && gaps.every((g) => g === 1) && sameOnah(last3)) {
      out.push({
        kind: 'chodesh-dilug',
        label: 'דפוס של וסת החודש בדילוג',
        description: `הימים בחודש מתקדמים ב-${Math.abs(step)} בכל חודש.`,
        sightings: ids(last3),
      });
    }
  }
  if (intervals.length >= 3) {
    const l3 = intervals.slice(-3);
    const last4 = s.slice(-4);
    if (l3[0] === l3[1] && l3[1] === l3[2] && sameOnah(last4)) {
      out.push({
        kind: 'haflagah-kavua',
        label: 'דפוס של וסת הפלגה',
        description: `שלוש הפלגות רצופות של ${l3[0]} ימים, באותה עונה.`,
        sightings: ids(last4),
      });
    }
    const st = l3[1]! - l3[0]!;
    if (st !== 0 && l3[2]! - l3[1]! === st && sameOnah(last4)) {
      out.push({
        kind: 'haflagah-dilug',
        label: 'דפוס של וסת הפלגה בדילוג',
        description: `ההפלגות משתנות ב-${Math.abs(st)} ימים בכל פעם (${l3.join(', ')}).`,
        sightings: ids(last4),
      });
    }
  }
  return out;
}
