'use client';

import { Button, Card, PageHeader } from '@tahara/ui';
import { formatGregorianMonth, formatHebrewMonth, type ISODate } from '@tahara/core/calendar';
import { bleedLength } from '@tahara/core/medical-engine';
import { BEDIKA_RESULT_LABELS, FLOW_LABELS, SYMPTOM_LABELS } from '@/domain/labels';
import { Icon } from '@/components/Icon';
import { EmptyState } from '@/components/app/bits';
import { useSheets } from '@/features/forms/ActionSheets';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';

interface Entry {
  date: ISODate;
  kind: string;
  color: string;
  text: string;
  edit: () => void;
}

export function HistoryScreen() {
  const { data } = useTahara();
  const { fmt } = useDerived();
  const { open } = useSheets();

  const entries: Entry[] = [
    ...data.periods.map((p) => ({
      date: p.start,
      kind: 'מחזור',
      color: 'var(--ev-bleed)',
      text: [
        bleedLength(p) ? `${bleedLength(p)} ימי דימום` : 'סיום לא תועד',
        p.flow ? FLOW_LABELS[p.flow] : '',
        p.notes ?? '',
      ]
        .filter(Boolean)
        .join(' · '),
      edit: () => open({ kind: 'period', existing: p }),
    })),
    ...data.symptomLogs.map((s) => ({
      date: s.date,
      kind: 'תסמינים',
      color: 'var(--tk-rose-soft)',
      text: s.symptoms.map((x) => SYMPTOM_LABELS[x]).join(', ') || (s.notes ?? ''),
      edit: () => open({ kind: 'symptom', existing: s }),
    })),
    ...data.fertilityLogs.map((f) => ({
      date: f.date,
      kind: 'פוריות',
      color: 'var(--ev-fertile)',
      text:
        [
          f.lh ? `LH ${f.lh === 'positive' ? 'חיובית' : 'שלילית'}` : '',
          f.bbt ? `חום ${f.bbt}°` : '',
        ]
          .filter(Boolean)
          .join(' · ') ||
        (f.notes ?? 'תיעוד'),
      edit: () => open({ kind: 'fertility', existing: f }),
    })),
    ...data.hefseks.map((h) => ({
      date: h.date,
      kind: 'הפסק טהרה',
      color: 'var(--ev-hefsek)',
      text: h.performed ? 'בוצע' : 'טרם בוצע',
      edit: () => open({ kind: 'hefsek', existing: h }),
    })),
    ...data.bedikot.map((b) => ({
      date: b.date,
      kind: `שבעה נקיים · יום ${b.day}`,
      color: 'var(--ev-clean)',
      text: `${b.part === 'morning' ? 'בוקר' : 'ערב'} · ${BEDIKA_RESULT_LABELS[b.result]}`,
      edit: () => open({ kind: 'bedika', day: b.day, part: b.part }),
    })),
    ...data.tevilot.flatMap((t) =>
      t.actual || t.planned
        ? [
            {
              date: (t.actual ?? t.planned)!,
              kind: 'טבילה',
              color: 'var(--ev-tevila)',
              text: t.done ? 'בוצעה' : 'מתוכננת',
              edit: () => open({ kind: 'tevila' }),
            },
          ]
        : [],
    ),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  const months = new Map<string, Entry[]>();
  for (const e of entries) {
    const k = e.date.slice(0, 7);
    months.set(k, [...(months.get(k) ?? []), e]);
  }

  return (
    <div>
      <PageHeader title="היסטוריה" description="כל התיעוד שלך, לפי חודשים." />
      {entries.length ? (
        <div className="space-y-3">
          {[...months.entries()].map(([month, list], i) => {
            const first = `${month}-01` as ISODate;
            const summary = [...new Set(list.map((e) => e.kind.split(' · ')[0]))].join(' · ');
            return (
              <details
                key={month}
                open={i === 0}
                className="group rounded-card border border-line bg-surface shadow-soft"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-semibold text-ink">{formatGregorianMonth(first)}</p>
                    <p className="text-xs text-ink-soft">
                      {formatHebrewMonth(first)} · {summary}
                    </p>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-ink-faint">
                    {list.length}
                    <Icon
                      name="chevron"
                      className="size-4 -rotate-90 transition-transform group-open:rotate-90"
                    />
                  </span>
                </summary>
                <ul className="divide-y divide-line border-t border-line">
                  {list.map((e, j) => (
                    <li key={j} className="flex items-center gap-3 px-5 py-3">
                      <span
                        aria-hidden
                        className="h-8 w-1 shrink-0 rounded-full"
                        style={{ background: e.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink">
                          <span className="font-medium">{e.kind}</span>
                          <span className="text-ink-soft"> · {fmt(e.date, { year: false })}</span>
                        </p>
                        <p className="truncate text-xs text-ink-soft">{e.text}</p>
                      </div>
                      <Button variant="ghost" className="min-h-9 px-3 text-sm" onClick={e.edit}>
                        עריכה
                      </Button>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Icon name="history" className="size-6" />}
          title="ההיסטוריה ריקה"
          text="כל מה שתתעדי, מחזורים, תסמינים, פוריות וטהרה, יופיע כאן לפי חודשים."
        />
      )}
      <Card className="mt-5 text-xs text-ink-faint">
        מועדי וסתות יופיעו בהיסטוריה רק לאחר אישור הכללים ההלכתיים.
      </Card>
    </div>
  );
}
