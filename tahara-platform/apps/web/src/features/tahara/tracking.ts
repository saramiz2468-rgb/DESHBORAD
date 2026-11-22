/**
 * Status of the user's OWN DOCUMENTATION of the purity process.
 *
 * This module counts what the user recorded. It computes no halachic
 * outcome: it never decides that a day "counts", that the seven days are
 * complete, or when immersion is permitted. Dates for the seven days come
 * only from the user's entries, and the tevila date is entered by the user.
 */
import { compareDates, type ISODate } from '@tahara/core/calendar';
import type { Bedika, Hefsek, Period, TaharaData, Tevila } from '@/domain/types';

export const SEVEN = 7;

export type TaharaStage =
  | 'none' // nothing recorded
  | 'bleeding' // latest period has no recorded end, or ends today/later
  | 'awaiting-hefsek' // period ended, no hefsek recorded after it
  | 'seven-days' // hefsek recorded, documenting days
  | 'all-documented' // user documented all 7 slots (NOT a halachic determination)
  | 'after-tevila'; // user marked tevila as done

export interface DaySlot {
  day: number;
  morning?: Bedika | undefined;
  evening?: Bedika | undefined;
  /** Date as entered by the user on the first documented check of the slot. */
  date?: ISODate | undefined;
}

export interface TaharaStatus {
  stage: TaharaStage;
  lastPeriod: Period | null;
  hefsek: Hefsek | null;
  slots: DaySlot[];
  documentedDays: number;
  remainingToDocument: number;
  tevila: Tevila | null;
}

const latest = <T extends { date?: ISODate; start?: ISODate }>(
  xs: readonly T[],
  key: (x: T) => ISODate,
): T | null => (xs.length ? [...xs].sort((a, b) => compareDates(key(b), key(a)))[0]! : null);

export function daySlots(bedikot: readonly Bedika[], hefsekId: string): DaySlot[] {
  return Array.from({ length: SEVEN }, (_, i) => {
    const day = i + 1;
    const mine = bedikot.filter((b) => b.hefsekId === hefsekId && b.day === day);
    const morning = mine.find((b) => b.part === 'morning');
    const evening = mine.find((b) => b.part === 'evening');
    const date = [morning?.date, evening?.date].filter(Boolean).sort()[0];
    return { day, morning, evening, date };
  });
}

export function taharaStatus(
  data: Pick<TaharaData, 'periods' | 'hefseks' | 'bedikot' | 'tevilot'>,
  today: ISODate,
): TaharaStatus {
  const lastPeriod = latest(data.periods, (p) => p.start);
  const hefsek = lastPeriod
    ? latest(
        data.hefseks.filter((h) => h.date >= lastPeriod.start),
        (h) => h.date,
      )
    : latest(data.hefseks, (h) => h.date);
  const slots = hefsek ? daySlots(data.bedikot, hefsek.id) : [];
  const documentedDays = slots.filter((s) => s.morning || s.evening).length;
  const tevila = hefsek ? (data.tevilot.find((t) => t.hefsekId === hefsek.id) ?? null) : null;

  let stage: TaharaStage = 'none';
  if (hefsek) {
    if (tevila?.done) stage = 'after-tevila';
    else if (documentedDays >= SEVEN) stage = 'all-documented';
    else stage = 'seven-days';
  } else if (lastPeriod) {
    const ended = lastPeriod.end ? lastPeriod.end < today : false;
    stage = ended ? 'awaiting-hefsek' : 'bleeding';
  }

  return {
    stage,
    lastPeriod,
    hefsek,
    slots,
    documentedDays,
    remainingToDocument: SEVEN - documentedDays,
    tevila,
  };
}
