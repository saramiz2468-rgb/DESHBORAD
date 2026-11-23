'use client';

import { useState } from 'react';
import { Button, Card, PageHeader, cn } from '@tahara/ui';
import { bleedLength, cycles as toCycles } from '@tahara/core/medical-engine';
import { FLOW_LABELS, SYMPTOM_LABELS } from '@/domain/labels';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/app/bits';
import { useSheets } from '@/features/forms/ActionSheets';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';

export function TrackScreen() {
  const { data } = useTahara();
  const { fmt } = useDerived();
  const { open } = useSheets();
  const [tab, setTab] = useState<'periods' | 'symptoms'>('periods');
  const sorted = [...data.periods].sort((a, b) => (a.start < b.start ? 1 : -1));
  const lengths = new Map(toCycles(data.periods).map((c) => [c.start, c]));
  const symptoms = [...data.symptomLogs].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <PageHeader
        title="מעקב מחזור"
        description="תיעוד המחזורים והתסמינים שלך. המעקב הרפואי נשמר בנפרד מהמעקב ההלכתי."
        aside={
          <Button
            onClick={() => open(tab === 'periods' ? { kind: 'period' } : { kind: 'symptom' })}
          >
            <Icon name="plus" className="size-4" />
            {tab === 'periods' ? 'מחזור חדש' : 'תיעוד תסמין'}
          </Button>
        }
      />

      <div
        role="tablist"
        aria-label="סוג תיעוד"
        className="mb-5 inline-flex rounded-pill border border-line bg-surface p-1"
      >
        {(
          [
            ['periods', `מחזורים (${data.periods.length})`],
            ['symptoms', `תסמינים (${data.symptomLogs.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'min-h-10 rounded-pill px-4 text-sm transition-colors',
              tab === key ? 'bg-ink font-semibold text-surface' : 'text-ink-soft',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'periods' ? (
        sorted.length ? (
          <ul className="space-y-3">
            {sorted.map((p) => {
              const c = lengths.get(p.start);
              const bleed = bleedLength(p);
              return (
                <li key={p.id}>
                  <Card className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{fmt(p.start)}</p>
                        <p className="mt-0.5 text-sm text-ink-soft">
                          {p.end ? `עד ${fmt(p.end, { year: false })}` : 'טרם תועד סיום'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        className="min-h-9 px-3 text-sm"
                        onClick={() => open({ kind: 'period', existing: p })}
                        aria-label={`עריכת המחזור מ-${fmt(p.start)}`}
                      >
                        <Icon name="edit" className="size-4" />
                        עריכה
                      </Button>
                    </div>
                    <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-surface-muted px-2 py-2.5">
                        <dt className="text-[0.7rem] text-ink-soft">ימי דימום</dt>
                        <dd className="mt-0.5 font-display font-black tracking-tight text-xl text-ink">
                          {bleed ?? '—'}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-surface-muted px-2 py-2.5">
                        <dt className="text-[0.7rem] text-ink-soft">אורך מחזור</dt>
                        <dd className="mt-0.5 font-display font-black tracking-tight text-xl text-ink">
                          {c ? c.length : '—'}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-surface-muted px-2 py-2.5">
                        <dt className="text-[0.7rem] text-ink-soft">עוצמה</dt>
                        <dd className="mt-0.5 text-[0.95rem] leading-7 text-ink">
                          {p.flow ? FLOW_LABELS[p.flow] : '—'}
                        </dd>
                      </div>
                    </dl>
                    {c && !c.plausible ? (
                      <p className="mt-2 text-xs text-ink-faint">
                        פער ארוך במיוחד. ייתכן שחסר תיעוד, והוא לא נכלל בממוצע.
                      </p>
                    ) : null}
                    {p.symptoms.length ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="תסמינים">
                        {p.symptoms.map((s) => (
                          <li
                            key={s}
                            className="rounded-pill bg-blush px-2.5 py-1 text-xs text-rose-strong"
                          >
                            {s === 'other' && p.otherSymptom ? p.otherSymptom : SYMPTOM_LABELS[s]}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {p.notes ? (
                      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{p.notes}</p>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<Icon name="drop" className="size-6" />}
            title="עדיין אין מחזורים"
            text="תיעוד המחזור הראשון יאפשר לחשב את היום במחזור, ואחרי כמה מחזורים גם הערכות."
            action={<Button onClick={() => open({ kind: 'period' })}>תיעוד מחזור</Button>}
          />
        )
      ) : symptoms.length ? (
        <ul className="space-y-3">
          {symptoms.map((s) => (
            <li key={s.id}>
              <Card className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {fmt(s.date, { year: false, weekday: true })}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {s.symptoms
                      .map((x) =>
                        x === 'other' && s.otherSymptom ? s.otherSymptom : SYMPTOM_LABELS[x],
                      )
                      .join(' · ')}
                  </p>
                  {s.notes ? <p className="mt-1 text-sm text-ink-faint">{s.notes}</p> : null}
                </div>
                <Button
                  variant="ghost"
                  className="min-h-9 px-3 text-sm"
                  onClick={() => open({ kind: 'symptom', existing: s })}
                >
                  עריכה
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<Icon name="symptom" className="size-6" />}
          title="אין תיעוד תסמינים"
          text="אפשר לתעד תסמינים בכל יום, גם מחוץ למחזור."
          action={<Button onClick={() => open({ kind: 'symptom' })}>תיעוד תסמין</Button>}
        />
      )}
    </div>
  );
}
