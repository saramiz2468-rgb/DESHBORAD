'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Notice, PageHeader, cn } from '@tahara/ui';
import {
  addDays,
  formatDate,
  formatGregorian,
  formatHebrew,
  WEEKDAYS,
} from '@tahara/core/calendar';
import { MINHAG_LABELS, ONAH_LABEL, RULES, type Prishah } from '@tahara/core/halacha-engine';
import { Icon } from '@/components/Icon';
import { EmptyState, SectionTitle } from '@/components/app/bits';
import { Sheet } from '@/components/app/Sheet';
import { useSheets } from '@/features/forms/ActionSheets';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';
import { TaharaTabs } from './TaharaScreen';

export function DraftNotice({ className }: { className?: string | undefined }) {
  return (
    <Notice tone="caution" title="טיוטה לבדיקה הלכתית" {...(className ? { className } : {})}>
      החישובים טרם נבדקו ואושרו על ידי גורם הלכתי מוסמך, ואין להסתמך עליהם. האפליקציה היא כלי עזר
      ואינה מחליפה פסיקת רב או יועצת הלכה.
    </Notice>
  );
}

function windowText(p: Prishah) {
  const f = p.window.from;
  const t = p.window.to;
  if (f.date === t.date) return `מהזריחה ${f.time} עד השקיעה ${t.time}`;
  return `מ-${f.time} ביום ${WEEKDAYS[new Date(f.date + 'T12:00:00Z').getUTCDay()]} עד ${t.time} ביום ${WEEKDAYS[new Date(t.date + 'T12:00:00Z').getUTCDay()]}`;
}

export function PrishahScreen() {
  const { data, today, calcHistory } = useTahara();
  const { vestot, city } = useDerived();
  const { open } = useSheets();
  const [explain, setExplain] = useState<Prishah | null>(null);
  const h = data.halacha;

  if (!h.configured) {
    return (
      <div>
        <PageHeader title="טהרה" description="ימי פרישה לפי הראיות שתיעדת." />
        <TaharaTabs active="prishah" />
        <EmptyState
          icon={<Icon name="moon" className="size-6" />}
          title="בחרי את המנהג ההלכתי שלך"
          text="כדי לחשב ימי פרישה צריך לדעת את המנהג שלך ואת העיר לחישוב זריחה ושקיעה. האפליקציה לא מניחה מנהג בשבילך."
          action={
            <Link
              href="/settings#halacha"
              className="inline-flex min-h-12 items-center rounded-pill bg-rose px-6 font-medium text-on-rose"
            >
              להגדרת המנהג
            </Link>
          }
        />
      </div>
    );
  }

  const alerts: Array<{ tone: 'info' | 'caution'; text: string }> = [];
  const tomorrow = addDays(today, 1);
  for (const p of vestot.upcoming) {
    if (p.hdate === today || (p.onah === 'night' && p.window.from.date === today))
      alerts.push({
        tone: 'caution',
        text: `היום: ${p.entries.map((e) => e.label).join(', ')} (${ONAH_LABEL[p.onah]}, ${windowText(p)}).`,
      });
    else if (p.hdate === tomorrow)
      alerts.push({
        tone: 'info',
        text: `מחר: ${p.entries.map((e) => e.label).join(', ')} (${ONAH_LABEL[p.onah]}).`,
      });
  }
  if (calcHistory[0] && calcHistory[0].reason !== 'חישוב ראשוני')
    alerts.push({ tone: 'info', text: `המועדים חושבו מחדש: ${calcHistory[0].reason}.` });
  for (const pt of vestot.patterns)
    alerts.push({
      tone: 'caution',
      text: `זוהה ${pt.label}. ${pt.description} קביעת וסת קבוע דורשת בירור עם רב.`,
    });
  for (const i of vestot.issues.filter(
    (x) =>
      x.kind !== 'unapproved-rules' && x.kind !== 'single-sighting' && x.kind !== 'no-sightings',
  ))
    alerts.push({ tone: 'caution', text: i.message });

  const options = [
    h.beinonitFullDay && 'עונה בינונית מעת לעת',
    h.beinonitDay31 && 'יום 31',
    h.ohrZarua && 'אור זרוע',
    h.haflagotNotUprooted && 'הפלגות שלא נעקרו',
    h.fixedVeset &&
      `וסת קבוע (${h.fixedVeset.type === 'chodesh' ? `יום ${h.fixedVeset.value} בחודש` : `הפלגה ${h.fixedVeset.value}`})`,
  ].filter(Boolean) as string[];

  return (
    <div>
      <PageHeader
        title="טהרה"
        description="ימי פרישה לפי הראיות שתיעדת."
        aside={
          <Button onClick={() => open({ kind: 'sighting' })}>
            <Icon name="plus" className="size-4" />
            ראייה
          </Button>
        }
      />
      <TaharaTabs active="prishah" />
      <DraftNotice className="mb-5" />

      <Card className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">{MINHAG_LABELS[h.minhag]}</span> · {city.name}
          </p>
          <Link href="/settings#halacha" className="text-sm font-medium text-rose hover:underline">
            שינוי
          </Link>
        </div>
        {options.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {options.map((o) => (
              <li key={o} className="rounded-pill bg-surface-muted px-3 py-1 text-xs text-ink-soft">
                {o}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      {alerts.length ? (
        <section className="mb-5" aria-label="התראות">
          <SectionTitle>התראות</SectionTitle>
          <ul className="space-y-2">
            {alerts.map((a, i) => (
              <li
                key={i}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-sm leading-relaxed',
                  a.tone === 'caution'
                    ? 'border-rose-soft/60 bg-blush/60 text-ink'
                    : 'border-line bg-surface text-ink-soft',
                )}
              >
                {a.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-5">
        <SectionTitle>מועדי פרישה קרובים</SectionTitle>
        {vestot.upcoming.length ? (
          <ul className="space-y-3">
            {vestot.upcoming.map((p) => (
              <li key={p.hdate + p.onah}>
                <Card className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-black tracking-tight text-xl text-plum">
                        {formatHebrew(p.hdate, { year: false })}
                      </p>
                      <p className="text-sm text-ink-soft">
                        יום {WEEKDAYS[new Date(p.hdate + 'T12:00:00Z').getUTCDay()]} ·{' '}
                        {formatGregorian(p.hdate)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-pill px-3 py-1 text-xs font-medium',
                        p.onah === 'night' ? 'bg-plum text-canvas' : 'bg-gold-soft text-ink',
                      )}
                    >
                      {ONAH_LABEL[p.onah]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-ink-faint" dir="rtl">
                    {windowText(p)} · {city.name}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="סיבות הפרישה">
                    {p.entries.map((e) => (
                      <li
                        key={e.kind}
                        className="rounded-pill border border-[var(--ev-veset)]/40 bg-[color-mix(in_oklab,var(--ev-veset)_10%,transparent)] px-3 py-1 text-xs text-ink"
                      >
                        {e.label}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="ghost"
                    className="mt-2 min-h-10 px-3 text-sm"
                    onClick={() => setExplain(p)}
                  >
                    <Icon name="book" className="size-4" />
                    הסבר הלכתי
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<Icon name="moon" className="size-6" />}
            title="אין מועדים קרובים"
            text={
              data.sightings.length
                ? 'לפי הראיות והנתונים שתועדו אין כרגע מועד פרישה קרוב, או שחסרים נתונים לחישוב.'
                : 'תעדי ראייה (או מחזור עם שעת התחלה) כדי שיחושבו ימי פרישה.'
            }
            action={<Button onClick={() => open({ kind: 'sighting' })}>תיעוד ראייה</Button>}
          />
        )}
      </section>

      {vestot.patterns.length ? (
        <section className="mb-5">
          <SectionTitle>דפוסים שזוהו</SectionTitle>
          <Card className="space-y-3">
            {vestot.patterns.map((pt) => (
              <div key={pt.kind}>
                <p className="font-medium text-ink">{pt.label}</p>
                <p className="text-sm text-ink-soft">{pt.description}</p>
              </div>
            ))}
            <p className="text-xs text-ink-faint">
              האפליקציה אינה קובעת וסת קבוע. אם רב קבע שיש לך וסת קבוע, אפשר להגדיר אותו בהגדרות,
              והחישוב יתעדכן.
            </p>
          </Card>
        </section>
      ) : null}

      {calcHistory.length ? (
        <details className="rounded-card border border-line bg-surface shadow-soft">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-ink">
            היסטוריית חישובים ({calcHistory.length})
          </summary>
          <ul className="divide-y divide-line border-t border-line text-sm">
            {calcHistory.map((c) => (
              <li key={c.id} className="flex justify-between gap-3 px-5 py-3">
                <span className="text-ink">{c.reason}</span>
                <span className="text-xs text-ink-faint">
                  {new Date(c.at).toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  · {c.upcoming} מועדים
                  {c.next ? ` · הבא ${formatDate(c.next, 'hebrew', { year: false })}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <ExplanationSheet prishah={explain} onClose={() => setExplain(null)} />
    </div>
  );
}

function ExplanationSheet({ prishah, onClose }: { prishah: Prishah | null; onClose: () => void }) {
  if (!prishah)
    return (
      <Sheet open={false} onClose={onClose} title="">
        {null}
      </Sheet>
    );
  return (
    <Sheet
      open
      onClose={onClose}
      title="הסבר הלכתי"
      description={`${formatDate(prishah.hdate, 'both', { weekday: true })} · ${ONAH_LABEL[prishah.onah]}`}
      size="lg"
    >
      <div className="space-y-4">
        <DraftNotice />
        {prishah.entries.map((e) => (
          <Card key={e.kind} className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-ink">{e.label}</h3>
              <span className="rounded-pill bg-gold-soft px-3 py-1 text-xs text-ink-soft">
                ממתין לאישור
              </span>
            </div>
            <dl className="space-y-2.5 text-sm">
              <Row k="על סמך הראיות">{e.explanation.basis.join(' · ')}</Row>
              {e.explanation.interval ? (
                <Row k="מספר ימי ההפלגה">{e.explanation.interval} ימים</Row>
              ) : null}
              <Row k="איך חושב התאריך">{e.explanation.computation}</Row>
              <Row k="מדוע זה יום פרישה">{e.explanation.why}</Row>
              <Row k="לפי מנהג">{e.explanation.minhag}</Row>
              <Row k="מקור">{e.explanation.source}</Row>
              <Row k="סטטוס הכלל">
                {RULES[e.ruleId]?.status === 'approved' ? 'אושר' : 'ממתין לאישור גורם הלכתי מוסמך'}
              </Row>
            </dl>
          </Card>
        ))}
      </div>
    </Sheet>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="text-xs text-ink-soft">{k}</dt>
      <dd className="leading-relaxed text-ink">{children}</dd>
    </div>
  );
}
