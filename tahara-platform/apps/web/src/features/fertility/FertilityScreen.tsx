'use client';

import { useState } from 'react';
import { Button, Card, Notice, PageHeader } from '@tahara/ui';
import { addDays, diffDays, formatGregorianShort, isBetween } from '@tahara/core/calendar';
import { bleedEnd, cycles } from '@tahara/core/medical-engine';
import { MUCUS_LABELS } from '@/domain/labels';
import { Icon } from '@/components/Icon';
import { EmptyState, EstimateTag, SectionTitle, Stat } from '@/components/app/bits';
import { FertilityChart, type FertilityDay } from '@/components/app/charts';
import { useSheets } from '@/features/forms/ActionSheets';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';

export function FertilityScreen() {
  const { data, today } = useTahara();
  const { prediction: p, stats, fmt } = useDerived();
  const { open } = useSheets();
  const logs = [...data.fertilityLogs].sort((a, b) => (a.date < b.date ? 1 : -1));
  const luteal = data.preferences.lutealDays;
  const [showAll, setShowAll] = useState(false);

  // Chart: the current cycle, from its start to the estimated next period (or today).
  let chartDays: FertilityDay[] = [];
  if (p.lastStart) {
    const end = p.nextStart ? addDays(p.nextStart, -1) : today;
    const len = Math.min(60, diffDays(p.lastStart, end < today ? today : end) + 1);
    const last = [...data.periods].sort((a, b) => (a.start < b.start ? 1 : -1))[0];
    const lastEnd = last ? (bleedEnd(last) ?? (last.start <= today ? today : last.start)) : null;
    chartDays = Array.from({ length: len }, (_, i) => {
      const date = addDays(p.lastStart!, i);
      const dayLogs = data.fertilityLogs.filter((l) => l.date === date);
      return {
        date,
        label: formatGregorianShort(date),
        cycleDay: i + 1,
        bleed: !!lastEnd && isBetween(date, p.lastStart!, lastEnd),
        bbt: dayLogs.find((l) => l.bbt !== undefined)?.bbt,
        lh: dayLogs.find((l) => l.lh)?.lh,
        fertile: !!p.fertileWindow && isBetween(date, p.fertileWindow[0], p.fertileWindow[1]),
        ovulation: p.ovulation === date,
      };
    });
  }

  const pastOvulations = cycles(data.periods)
    .filter((c) => c.plausible)
    .map((c) => ({ start: c.start, ovulation: addDays(c.nextStart, -luteal) }))
    .reverse();

  return (
    <div>
      <PageHeader
        title="פוריות וביוץ"
        description="הערכות לפי המחזורים ותיעוד הפוריות שלך."
        aside={
          <Button onClick={() => open({ kind: 'fertility' })}>
            <Icon name="plus" className="size-4" />
            תיעוד
          </Button>
        }
      />
      <Notice className="mb-5">
        כל המועדים כאן הם הערכה סטטיסטית בלבד. הם אינם אבחון רפואי ואינם מתאימים כאמצעי למניעת
        היריון.
      </Notice>

      {p.fertileWindow && p.ovulation ? (
        <Card className="mb-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink">המחזור הנוכחי</h2>
            <EstimateTag />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
            <Stat
              label="ביוץ משוער"
              value={<span className="text-lg">{fmt(p.ovulation, { year: false })}</span>}
            />
            <Stat
              label="חלון פוריות"
              value={
                <span className="text-base">
                  {fmt(p.fertileWindow[0], { year: false })} –{' '}
                  {fmt(p.fertileWindow[1], { year: false })}
                </span>
              }
            />
            <Stat
              label="מחזור צפוי"
              value={
                p.nextStart ? (
                  <span className="text-lg">{fmt(p.nextStart, { year: false })}</span>
                ) : null
              }
            />
            <Stat
              label="אורך מחזור ממוצע"
              value={stats.averageLength ?? p.cycleLength}
              unit="ימים"
            />
          </div>
          <p className="mt-4 text-xs text-ink-faint">
            {p.ovulationSource === 'lh'
              ? 'הביוץ המשוער חושב לפי בדיקת ביוץ חיובית שתיעדת (יום אחריה).'
              : `ביוץ משוער = המחזור הצפוי פחות ${luteal} ימים.`}
          </p>
        </Card>
      ) : (
        <EmptyState
          className="mb-5"
          icon={<Icon name="fertility" className="size-6" />}
          title="עדיין אין מספיק נתונים להערכה"
          text="הערכת ביוץ תוצג אחרי שני מחזורים מתועדים, או אחרי הגדרת אורך מחזור בהגדרות."
        />
      )}

      {chartDays.length ? (
        <Card className="mb-5">
          <FertilityChart title="גרף המחזור הנוכחי" days={chartDays} />
        </Card>
      ) : null}

      <section className="mb-5">
        <SectionTitle>תיעוד פוריות</SectionTitle>
        {logs.length ? (
          <Card className="p-0 sm:p-0">
            <ul className="divide-y divide-line">
              {(showAll ? logs : logs.slice(0, 8)).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {fmt(l.date, { year: false, weekday: true })}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {[
                        l.lh ? `LH ${l.lh === 'positive' ? 'חיובית' : 'שלילית'}` : '',
                        l.bbt ? `חום ${l.bbt}°` : '',
                        l.mucus ? MUCUS_LABELS[l.mucus] : '',
                        l.ovulationPain ? 'כאבי ביוץ' : '',
                        l.notes ?? '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="min-h-9 px-3 text-sm"
                    onClick={() => open({ kind: 'fertility', existing: l })}
                  >
                    עריכה
                  </Button>
                </li>
              ))}
            </ul>
            {logs.length > 8 ? (
              <div className="border-t border-line px-4 py-2">
                <Button
                  variant="ghost"
                  className="min-h-10 px-3 text-sm"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? 'הצגת פחות' : `הצגת כל ${logs.length} הרשומות`}
                </Button>
              </div>
            ) : null}
          </Card>
        ) : (
          <EmptyState
            icon={<Icon name="flask" className="size-6" />}
            title="אין עדיין תיעוד"
            text="אפשר לתעד בדיקות ביוץ, הפרשות, כאבי ביוץ וחום גוף בסיסי."
            action={
              <Button variant="secondary" onClick={() => open({ kind: 'fertility', focus: 'lh' })}>
                תיעוד בדיקת ביוץ
              </Button>
            }
          />
        )}
      </section>

      {pastOvulations.length ? (
        <section>
          <SectionTitle action={<EstimateTag />}>היסטוריית ביוץ משוער</SectionTitle>
          <Card className="p-0 sm:p-0">
            <ul className="divide-y divide-line">
              {pastOvulations.map((o) => (
                <li key={o.start} className="flex justify-between gap-3 px-4 py-3 text-sm">
                  <span className="text-ink-soft">מחזור מ-{fmt(o.start, { year: false })}</span>
                  <span className="text-ink">{fmt(o.ovulation, { year: false })}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
