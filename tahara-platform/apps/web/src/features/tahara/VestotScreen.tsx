'use client';

import { Button, Card, PageHeader } from '@tahara/ui';
import { diffDays, formatDate } from '@tahara/core/calendar';
import { ONAH_LABEL, RULES } from '@tahara/core/halacha-engine';
import { COMPLEX_FLAG_LABELS, SIGHTING_KIND_LABELS } from '@/domain/labels';
import { Icon } from '@/components/Icon';
import { EmptyState, SectionTitle } from '@/components/app/bits';
import { useSheets } from '@/features/forms/ActionSheets';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';
import { DraftNotice } from './PrishahScreen';
import { TaharaTabs } from './TaharaScreen';

export function VestotScreen() {
  const { data } = useTahara();
  const { vestot } = useDerived();
  const { open } = useSheets();
  const resolved = [...vestot.resolved].reverse();
  const usable = vestot.resolved.filter((r) => r.computable && r.onah);
  const intervals = usable
    .slice(1)
    .map((r, i) => ({ from: usable[i]!, to: r, days: diffDays(usable[i]!.hdate, r.hdate) + 1 }));

  return (
    <div>
      <PageHeader
        title="טהרה"
        description="יומן הראיות וההפלגות שלך."
        aside={
          <Button onClick={() => open({ kind: 'sighting' })}>
            <Icon name="plus" className="size-4" />
            ראייה
          </Button>
        }
      />
      <TaharaTabs active="vestot" />
      <DraftNotice className="mb-5" />

      <section className="mb-6">
        <SectionTitle>ראיות שתועדו</SectionTitle>
        {resolved.length ? (
          <Card className="p-0 sm:p-0">
            <ul className="divide-y divide-line">
              {resolved.map((r) => {
                const s = data.sightings.find((x) => x.id === r.id)!;
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {formatDate(r.civilDate, 'both', { year: false, weekday: true })}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {[
                          s.time ? `שעה ${s.time}` : 'ללא שעה',
                          r.onah ? ONAH_LABEL[r.onah] : 'עונה לא ידועה',
                          s.kind !== 'regular' ? SIGHTING_KIND_LABELS[s.kind] : '',
                          ...s.flags.map((f) => COMPLEX_FLAG_LABELS[f]),
                          s.periodId ? 'מקושר למחזור' : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {!r.computable ? (
                        <p className="text-xs font-medium text-rose-strong">
                          לא נכלל בחישוב · דורש בירור הלכתי
                        </p>
                      ) : !r.onah ? (
                        <p className="text-xs font-medium text-rose-strong">
                          חסרה עונה · לא נכלל בחישוב
                        </p>
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      className="min-h-9 px-3 text-sm"
                      onClick={() => open({ kind: 'sighting', existing: s })}
                    >
                      עריכה
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <EmptyState
            icon={<Icon name="moon" className="size-6" />}
            title="אין עדיין ראיות"
            text="ראייה נרשמת כאן ישירות, או אוטומטית כשמתעדים מחזור עם האפשרות 'לרשום גם כראייה'."
            action={<Button onClick={() => open({ kind: 'sighting' })}>תיעוד ראייה</Button>}
          />
        )}
      </section>

      {intervals.length ? (
        <section className="mb-6">
          <SectionTitle>הפלגות</SectionTitle>
          <Card className="p-0 sm:p-0">
            <ul className="divide-y divide-line">
              {[...intervals].reverse().map((iv) => (
                <li
                  key={iv.to.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="text-ink-soft">
                    {formatDate(iv.from.hdate, 'hebrew', { year: false })} ←{' '}
                    {formatDate(iv.to.hdate, 'hebrew', { year: false })}
                  </span>
                  <span className="font-display text-lg text-ink">
                    {iv.days} <span className="font-sans text-xs text-ink-soft">ימים</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-4 py-3 text-xs text-ink-faint">
              ספירה מתחילת ראייה לתחילת הראייה הבאה, כולל שני הימים.
            </p>
          </Card>
        </section>
      ) : null}

      <section>
        <SectionTitle>הכללים ומקורותיהם</SectionTitle>
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-line">
            {Object.values(RULES).map((r) => (
              <li key={r.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">{r.name}</p>
                  <span className="rounded-pill bg-gold-soft px-3 py-1 text-xs text-ink-soft">
                    {r.status === 'approved' ? 'אושר' : 'ממתין לאישור'}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{r.summary}</p>
                <p className="mt-1 text-xs text-ink-faint">מקור: {r.source}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
