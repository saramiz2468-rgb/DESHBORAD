/**
 * What to show on a calendar day. Display aggregation only: medical records,
 * medical ESTIMATES and halachic DOCUMENTATION are listed side by side and
 * never combined into a conclusion.
 */
import { addDays, isBetween, type ISODate } from '@tahara/core/calendar';
import { bleedEnd, type Prediction } from '@tahara/core/medical-engine';
import type {
  Bedika,
  FertilityLog,
  Hefsek,
  Period,
  SymptomLog,
  TaharaData,
  Tevila,
} from '@/domain/types';

export type EventKind =
  'bleed' | 'hefsek' | 'clean' | 'tevila' | 'fertile' | 'ovulation' | 'expected' | 'veset';

export const EVENT_LEGEND: ReadonlyArray<{ kind: EventKind; label: string; note?: string }> = [
  { kind: 'bleed', label: 'דימום' },
  { kind: 'hefsek', label: 'הפסק טהרה' },
  { kind: 'clean', label: 'שבעה נקיים (תיעוד)' },
  { kind: 'tevila', label: 'טבילה' },
  { kind: 'fertile', label: 'חלון פוריות משוער' },
  { kind: 'ovulation', label: 'ביוץ משוער' },
  { kind: 'expected', label: 'מחזור צפוי (הערכה)' },
  { kind: 'veset', label: 'מועדי וסתות', note: 'יוצגו רק אחרי אישור הכללים' },
];

export interface DayInfo {
  date: ISODate;
  kinds: Set<EventKind>;
  periods: Period[];
  hefseks: Hefsek[];
  bedikot: Bedika[];
  tevilot: Array<{ tevila: Tevila; type: 'planned' | 'actual' }>;
  symptoms: SymptomLog[];
  fertility: FertilityLog[];
}

export function dayInfo(
  date: ISODate,
  data: TaharaData,
  prediction: Prediction,
  today: ISODate,
): DayInfo {
  const kinds = new Set<EventKind>();
  const periods = data.periods.filter((p) => {
    const end =
      bleedEnd(p) ??
      (p.start <= today ? (addDays(p.start, 6) < today ? addDays(p.start, 6) : today) : p.start);
    return isBetween(date, p.start, end);
  });
  if (periods.length) kinds.add('bleed');

  if (prediction.nextStart && date > today) {
    const len = data.preferences.declaredBleedDays ?? 5;
    if (isBetween(date, prediction.nextStart, addDays(prediction.nextStart, len - 1)))
      kinds.add('expected');
  }
  if (
    prediction.fertileWindow &&
    isBetween(date, prediction.fertileWindow[0], prediction.fertileWindow[1])
  )
    kinds.add('fertile');
  if (prediction.ovulation === date) kinds.add('ovulation');

  const hefseks = data.hefseks.filter((h) => h.date === date);
  if (hefseks.length) kinds.add('hefsek');
  const bedikot = data.bedikot.filter((b) => b.date === date);
  if (bedikot.length) kinds.add('clean');
  const tevilot = data.tevilot.flatMap((t) => [
    ...(t.actual === date ? [{ tevila: t, type: 'actual' as const }] : []),
    ...(t.planned === date && t.actual !== date ? [{ tevila: t, type: 'planned' as const }] : []),
  ]);
  if (tevilot.length) kinds.add('tevila');

  return {
    date,
    kinds,
    periods,
    hefseks,
    bedikot,
    tevilot,
    symptoms: data.symptomLogs.filter((s) => s.date === date),
    fertility: data.fertilityLogs.filter((f) => f.date === date),
  };
}
