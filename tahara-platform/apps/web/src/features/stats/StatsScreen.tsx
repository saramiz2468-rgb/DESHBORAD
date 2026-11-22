'use client';

import { useState } from 'react';
import { Card, PageHeader } from '@tahara/ui';
import { addDays, addMonths, formatGregorianShort, type ISODate } from '@tahara/core/calendar';
import { bleedLength, cycleStats, cycles, sortByStart } from '@tahara/core/medical-engine';
import { Icon } from '@/components/Icon';
import { EmptyState, EstimateTag, Stat } from '@/components/app/bits';
import { Segmented } from '@/components/app/fields';
import { CycleBarChart } from '@/components/app/charts';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';

type Range = '3' | '6' | '12' | 'all';
const RANGES: ReadonlyArray<{ value: Range; label: string }> = [
  { value: '3', label: '3 חודשים' },
  { value: '6', label: 'חצי שנה' },
  { value: '12', label: 'שנה' },
  { value: 'all', label: 'הכול' },
];

export function StatsScreen() {
  const { data, today } = useTahara();
  const { fmt } = useDerived();
  const [range, setRange] = useState<Range>('6');
  const from: ISODate | null = range === 'all' ? null : addMonths(today, -Number(range));
  const periods = sortByStart(data.periods).filter((p) => !from || p.start >= from);
  // Include the period just before the range so the first cycle in range has a length.
  const before = from
    ? sortByStart(data.periods)
        .filter((p) => p.start < from)
        .at(-1)
    : undefined;
  const scoped = before ? [before, ...periods] : periods;
  const s = cycleStats(scoped);
  const cyc = cycles(scoped).filter((c) => c.plausible);
  const luteal = data.preferences.lutealDays;

  if (data.periods.length < 2) {
    return (
      <div>
        <PageHeader title="סטטיסטיקות" description="תמונת מצב לאורך זמן." />
        <EmptyState
          icon={<Icon name="stats" className="size-6" />}
          title="עדיין אין מספיק נתונים"
          text="אחרי שני מחזורים מתועדים לפחות יוצגו כאן ממוצעים, גרפים ומגמות."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="סטטיסטיקות" description="תמונת מצב לאורך זמן, לפי התיעוד שלך." />
      <div className="mb-5">
        <Segmented
          label="טווח זמן"
          value={range}
          options={RANGES}
          onChange={(v) => v && setRange(v)}
        />
      </div>

      <Card className="mb-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          <Stat label="אורך מחזור ממוצע" value={s.averageLength} unit="ימים" />
          <Stat label="המחזור הקצר ביותר" value={s.shortest} unit="ימים" />
          <Stat label="המחזור הארוך ביותר" value={s.longest} unit="ימים" />
          <Stat label="ממוצע ימי דימום" value={s.averageBleed} unit="ימים" />
        </div>
        <p className="mt-4 text-xs text-ink-faint">
          {s.count} מחזורים בטווח. מרווחים של יותר מ-90 יום נחשבים לתיעוד חסר ואינם נכללים.
          {s.irregular ? ' אורכי המחזור בטווח משתנים במידה ניכרת.' : ''}
        </p>
      </Card>

      {cyc.length ? (
        <Card className="mb-5">
          <CycleBarChart
            title="אורך מחזור"
            average={s.averageLength}
            data={cyc.map((c) => ({
              key: c.start,
              label: formatGregorianShort(c.start).slice(0, -3),
              value: c.length,
              detail: `מ-${fmt(c.start, { year: false })}`,
            }))}
          />
        </Card>
      ) : (
        <Card className="mb-5 text-sm text-ink-soft">
          אין מחזורים שלמים בטווח הזה. אפשר לבחור טווח ארוך יותר.
        </Card>
      )}

      {periods.some((p) => bleedLength(p)) ? (
        <Card className="mb-5">
          <CycleBarChart
            title="ימי דימום"
            average={s.averageBleed}
            data={periods
              .filter((p) => bleedLength(p))
              .map((p) => ({
                key: p.id,
                label: formatGregorianShort(p.start).slice(0, -3),
                value: bleedLength(p)!,
                detail: fmt(p.start, { year: false }),
              }))}
          />
        </Card>
      ) : null}

      {cyc.length ? (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">מועדי ביוץ משוערים</h2>
            <EstimateTag />
          </div>
          <ul className="divide-y divide-line text-sm">
            {[...cyc].reverse().map((c) => (
              <li key={c.start} className="flex justify-between py-2.5">
                <span className="text-ink-soft">מחזור של {c.length} ימים</span>
                <span className="text-ink">
                  {fmt(addDays(c.nextStart, -luteal), { year: false })}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-faint">
            לפי {luteal} ימים לפני המחזור שאחריו. הסטטיסטיקות מתארות את התיעוד בלבד ואינן מסקנה
            רפואית.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
