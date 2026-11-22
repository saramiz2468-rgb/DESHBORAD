/**
 * DEMO scenarios for the stage-A design simulation.
 *
 * Every value here is fictional and generated relative to today so the
 * screens can be reviewed in each state. The UI always labels them as
 * demo data ("נתוני הדגמה") – they are never presented as a user's records
 * and are never sent anywhere or stored outside the tab's memory.
 */
import { addDays, type ISODate } from '@tahara/core/calendar';
import type { Bedika, TaharaData } from '@/domain/types';
import { emptyData } from './defaults';

export type ScenarioKey =
  'new' | 'partial' | 'tracking' | 'seven-days' | 'after-tevila' | 'fertility' | 'irregular';

export const SCENARIOS: ReadonlyArray<{ key: ScenarioKey; label: string; description: string }> = [
  { key: 'new', label: 'משתמשת חדשה', description: 'אין עדיין שום נתון' },
  { key: 'partial', label: 'נתונים חלקיים', description: 'מחזור אחד בלבד, בלי היסטוריה' },
  { key: 'tracking', label: 'מעקב מחזור', description: 'כמה מחזורים סדירים' },
  { key: 'seven-days', label: 'בשבעה נקיים', description: 'הפסק טהרה ותיעוד חלקי' },
  { key: 'after-tevila', label: 'אחרי טבילה', description: 'תהליך שתועד עד הטבילה' },
  { key: 'fertility', label: 'מעקב פוריות', description: 'בדיקות ביוץ וחום גוף' },
  { key: 'irregular', label: 'מחזורים לא סדירים', description: 'אורכי מחזור משתנים' },
];

let n = 0;
const id = (p: string) => `demo-${p}-${++n}`;

function periodsFrom(today: ISODate, lengths: number[], dayOfCycle: number, bleed = 5) {
  const starts: ISODate[] = [addDays(today, -(dayOfCycle - 1))];
  for (const len of [...lengths].reverse()) starts.unshift(addDays(starts[0]!, -len));
  return starts.map((start, i) => ({
    id: id('p'),
    start,
    end: i === starts.length - 1 && dayOfCycle <= bleed ? undefined : addDays(start, bleed - 1),
    flow: (['medium', 'heavy', 'medium', 'light'] as const)[i % 4],
    symptoms:
      i % 2 ? (['abdominal-pain', 'fatigue'] as const).slice() : (['headache'] as const).slice(),
  }));
}

export function buildScenario(key: ScenarioKey, today: ISODate): TaharaData {
  const d = emptyData();
  switch (key) {
    case 'new':
      return d;
    case 'partial':
      return { ...d, periods: periodsFrom(today, [], 12) };
    case 'tracking':
      return {
        ...d,
        periods: periodsFrom(today, [28, 30, 27, 29], 9),
        symptomLogs: [
          { id: id('s'), date: addDays(today, -2), symptoms: ['bloating', 'fatigue'], notes: '' },
        ],
      };
    case 'irregular':
      return { ...d, periods: periodsFrom(today, [24, 38, 31, 45], 20, 6) };
    case 'fertility': {
      const periods = periodsFrom(today, [28, 29, 28], 13);
      const start = periods.at(-1)!.start;
      const bbt = [
        36.4, 36.35, 36.45, 36.4, 36.3, 36.4, 36.35, 36.45, 36.4, 36.5, 36.4, 36.45, 36.5,
      ];
      return {
        ...d,
        periods,
        fertilityLogs: [
          ...bbt.map((t, i) => ({ id: id('f'), date: addDays(start, i), bbt: t, symptoms: [] })),
          {
            id: id('f'),
            date: addDays(start, 10),
            lh: 'negative' as const,
            mucus: 'creamy' as const,
            symptoms: [],
          },
          {
            id: id('f'),
            date: addDays(start, 11),
            lh: 'negative' as const,
            mucus: 'watery' as const,
            symptoms: [],
          },
          {
            id: id('f'),
            date: addDays(start, 12),
            lh: 'positive' as const,
            mucus: 'egg-white' as const,
            ovulationPain: true,
            symptoms: [],
          },
        ],
        preferences: { ...d.preferences },
      };
    }
    case 'seven-days':
    case 'after-tevila': {
      const after = key === 'after-tevila';
      const periods = periodsFrom(today, [28, 29, 28], after ? 16 : 9);
      const last = periods.at(-1)!;
      const hefsekDate = addDays(last.start, 4);
      const hefsek = { id: id('h'), date: hefsekDate, time: '17:20', performed: true, notes: '' };
      const days = after ? 7 : 3;
      const bedikot: Bedika[] = [];
      for (let day = 1; day <= days; day++) {
        const date = addDays(hefsekDate, day);
        for (const part of ['morning', 'evening'] as const) {
          if (!after && day === days && part === 'evening') continue;
          bedikot.push({ id: id('b'), hefsekId: hefsek.id, day, part, date, result: 'clean' });
        }
      }
      const tevilaDate = addDays(hefsekDate, 7);
      return {
        ...d,
        periods,
        hefseks: [hefsek],
        bedikot,
        tevilot: [
          {
            id: id('t'),
            hefsekId: hefsek.id,
            planned: tevilaDate,
            actual: after ? tevilaDate : undefined,
            done: after,
          },
        ],
        checklist: d.checklist.map((c, i) => ({ ...c, done: after || i < 2 })),
      };
    }
  }
}
