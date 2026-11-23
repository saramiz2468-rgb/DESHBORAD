'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Notice, PageHeader, cn } from '@tahara/ui';
import { formatGregorian, formatHebrew } from '@tahara/core/calendar';
import { BEDIKA_RESULT_LABELS } from '@/domain/labels';
import type { Bedika } from '@/domain/types';
import { Icon } from '@/components/Icon';
import { EmptyState, SectionTitle } from '@/components/app/bits';
import { TextInput } from '@/components/app/fields';
import { useSheets } from '@/features/forms/ActionSheets';
import { useDerived } from '@/state/derived';
import { newId, useTahara } from '@/state/store';
import { SEVEN } from './tracking';

export function TaharaTabs({ active }: { active: 'tahara' | 'prishah' | 'vestot' }) {
  const tabs = [
    ['tahara', '/tahara', 'שבעה נקיים וטבילה'],
    ['prishah', '/tahara/prishah', 'ימי פרישה'],
    ['vestot', '/tahara/vestot', 'ראיות ווסתות'],
  ] as const;
  return (
    <nav
      aria-label="אזורי טהרה"
      className="mb-5 flex max-w-full gap-1 overflow-x-auto rounded-pill border border-line bg-surface p-1 [scrollbar-width:none]"
    >
      {tabs.map(([key, href, label]) => (
        <Link
          key={key}
          href={href}
          aria-current={active === key ? 'page' : undefined}
          className={cn(
            'inline-flex min-h-10 shrink-0 items-center rounded-pill px-4 text-sm whitespace-nowrap',
            active === key ? 'bg-ink font-semibold text-surface' : 'text-ink-soft',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function TaharaScreen() {
  const { tahara: t, fmt } = useDerived();
  const { open } = useSheets();

  return (
    <div>
      <PageHeader title="טהרה" description="תיעוד אישי ודיסקרטי של תהליך הטהרה." />
      <TaharaTabs active="tahara" />
      <Notice className="mb-5">
        התיעוד כאן הוא לשימושך בלבד. האפליקציה אינה פוסקת, אינה קובעת אם יום נחשב ואינה מחשבת מועד
        טבילה. בכל שאלה יש להתייעץ עם רב או יועצת.
      </Notice>

      {!t.hefsek ? (
        <EmptyState
          icon={<Icon name="sparkle" className="size-6" />}
          title={t.stage === 'bleeding' ? 'המחזור עדיין פתוח בתיעוד' : 'טרם תועד הפסק טהרה'}
          text="אחרי תיעוד הפסק טהרה יופיע כאן לוח לתיעוד בדיקות שבעה נקיים, פרטי הטבילה ורשימת הכנות."
          action={<Button onClick={() => open({ kind: 'hefsek' })}>תיעוד הפסק טהרה</Button>}
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <SectionTitle
              action={
                <Button
                  variant="ghost"
                  className="min-h-9 px-3 text-sm"
                  onClick={() => open({ kind: 'hefsek', existing: t.hefsek! })}
                >
                  עריכה
                </Button>
              }
            >
              הפסק טהרה
            </SectionTitle>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-ink-soft">תאריך</p>
                <p className="mt-1 text-ink">{fmt(t.hefsek.date)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-soft">שעה</p>
                <p className="mt-1 text-ink" dir="ltr">
                  {t.hefsek.time ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-soft">סטטוס</p>
                <p className="mt-1 text-ink">{t.hefsek.performed ? 'בוצע' : 'טרם בוצע'}</p>
              </div>
            </div>
            {t.hefsek.notes ? <p className="mt-3 text-sm text-ink-soft">{t.hefsek.notes}</p> : null}
          </Card>

          <SevenDays />
          <TevilaCard />
          <Checklist />
        </div>
      )}
    </div>
  );
}

function SevenDays() {
  const { tahara: t } = useDerived();
  const { open } = useSheets();
  const pct = Math.round((t.documentedDays / SEVEN) * 100);

  return (
    <section aria-labelledby="seven">
      <SectionTitle
        action={
          <Button
            variant="secondary"
            className="min-h-9 px-4 text-sm"
            onClick={() => open({ kind: 'bedika' })}
          >
            תיעוד בדיקה
          </Button>
        }
      >
        <span id="seven">שבעה נקיים</span>
      </SectionTitle>
      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-xs text-ink-soft">
          <span>
            תיעדת {t.documentedDays} מתוך {SEVEN} ימים
          </span>
          <span>{pct}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-gold-soft/60"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={SEVEN}
          aria-valuenow={t.documentedDays}
          aria-label="התקדמות התיעוד"
        >
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[0.7rem] text-ink-faint">
          ההתקדמות משקפת את התיעוד שלך בלבד ואינה קביעה הלכתית.
        </p>
      </div>
      <ol className="grid gap-2.5 sm:grid-cols-2">
        {t.slots.map((s) => {
          const documented = !!(s.morning || s.evening);
          return (
            <li key={s.day}>
              <Card className={cn('p-4', documented && 'border-gold-soft')}>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-full font-display font-black tracking-tight text-lg',
                      documented ? 'bg-gold text-surface' : 'bg-gold-soft/50 text-ink-soft',
                    )}
                  >
                    {s.day}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">יום {s.day}</p>
                    <p className="text-xs text-ink-soft">
                      {s.date
                        ? `${formatHebrew(s.date, { year: false })} · ${formatGregorian(s.date, { year: false })}`
                        : 'טרם תועד'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <SlotButton
                    label="בוקר"
                    bedika={s.morning}
                    onClick={() => open({ kind: 'bedika', day: s.day, part: 'morning' })}
                  />
                  <SlotButton
                    label="ערב"
                    bedika={s.evening}
                    onClick={() => open({ kind: 'bedika', day: s.day, part: 'evening' })}
                  />
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SlotButton({
  label,
  bedika,
  onClick,
}: {
  label: string;
  bedika?: Bedika | undefined;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-12 flex-col items-center justify-center rounded-xl border px-2 text-xs transition-colors',
        bedika
          ? 'border-[var(--ev-clean)]/40 bg-[color-mix(in_oklab,var(--ev-clean)_10%,transparent)] text-ink'
          : 'border-dashed border-line text-ink-faint hover:border-rose-soft',
      )}
    >
      <span className="font-medium">{label}</span>
      <span className="mt-0.5">
        {bedika ? BEDIKA_RESULT_LABELS[bedika.result].replace(' (לברר עם רב)', '') : 'הוספת תיעוד'}
      </span>
    </button>
  );
}

function TevilaCard() {
  const { tahara: t, fmt } = useDerived();
  const { open } = useSheets();
  const tv = t.tevila;
  return (
    <Card className="border-gold-soft/70">
      <SectionTitle
        action={
          <Button
            variant="ghost"
            className="min-h-9 px-3 text-sm"
            onClick={() => open({ kind: 'tevila' })}
          >
            {tv ? 'עריכה' : 'הוספה'}
          </Button>
        }
      >
        טבילה
      </SectionTitle>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-ink-soft">תאריך מתוכנן</p>
          <p className="mt-1 text-ink">{tv?.planned ? fmt(tv.planned, { year: false }) : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-ink-soft">בפועל</p>
          <p className="mt-1 text-ink">{tv?.actual ? fmt(tv.actual, { year: false }) : '—'}</p>
        </div>
        <div>
          <p className="text-xs text-ink-soft">סטטוס</p>
          <p className="mt-1 text-ink">{tv?.done ? 'בוצעה' : 'טרם בוצעה'}</p>
        </div>
      </div>
      {tv?.notes ? <p className="mt-3 text-sm text-ink-soft">{tv.notes}</p> : null}
      <p className="mt-3 text-xs text-ink-faint">
        את התאריך קובעים לפי הנחיית רב. האפליקציה רק שומרת אותו.
      </p>
    </Card>
  );
}

function Checklist() {
  const { data, setChecklist, notify } = useTahara();
  const [text, setText] = useState('');
  const items = data.checklist;
  const done = items.filter((i) => i.done).length;

  return (
    <Card>
      <SectionTitle
        action={
          <span className="text-xs text-ink-soft">
            {done}/{items.length}
          </span>
        }
      >
        רשימת הכנות לטבילה
      </SectionTitle>
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5">
            <label className="flex min-h-10 flex-1 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() =>
                  setChecklist(items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))
                }
                className="size-5 accent-[var(--tk-rose)]"
              />
              <span
                className={cn(
                  'text-[0.95rem]',
                  item.done ? 'text-ink-faint line-through' : 'text-ink',
                )}
              >
                {item.text}
              </span>
            </label>
            {item.custom ? (
              <button
                type="button"
                aria-label={`מחיקת ${item.text}`}
                onClick={() => setChecklist(items.filter((i) => i.id !== item.id))}
                className="grid size-9 place-items-center rounded-full text-ink-faint hover:bg-surface-muted"
              >
                <Icon name="trash" className="size-4" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = text.trim();
          if (!v) return;
          setChecklist([
            ...items,
            { id: newId(), text: v.slice(0, 80), done: false, custom: true },
          ]);
          setText('');
          notify('המשימה נוספה');
        }}
      >
        <label className="sr-only" htmlFor="new-task">
          משימה חדשה
        </label>
        <TextInput
          id="new-task"
          placeholder="הוספת משימה אישית"
          value={text}
          maxLength={80}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" variant="secondary" className="shrink-0 px-4">
          הוספה
        </Button>
      </form>
      {done ? (
        <Button
          variant="ghost"
          className="mt-2 min-h-9 px-3 text-sm"
          onClick={() => setChecklist(items.map((i) => ({ ...i, done: false })))}
        >
          ניקוי הסימונים
        </Button>
      ) : null}
    </Card>
  );
}
