'use client';

import Link from 'next/link';
import { Button, Card, cn } from '@tahara/ui';
import { Icon } from '@/components/Icon';
import { useSheets } from '@/features/forms/ActionSheets';
import { SEVEN } from '@/features/tahara/tracking';
import { useDerived } from '@/state/derived';

/** Halachic DOCUMENTATION status on the home screen. Never a ruling. */
export function TaharaCard() {
  const { tahara: t, fmt, vestot } = useDerived();
  const nextPrishah = vestot.upcoming[0];
  const { open } = useSheets();

  const header = (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 font-semibold text-ink">
        <Icon name="sparkle" className="size-5 text-gold" />
        טהרה
      </h2>
      <Link
        href="/tahara"
        className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-rose hover:underline"
      >
        למעקב הטהרה
        <Icon name="chevron" className="size-4" />
      </Link>
    </div>
  );
  const prishahLine = nextPrishah ? (
    <Link
      href="/tahara/prishah"
      className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--ev-veset)]/30 px-3 py-2.5 text-sm"
    >
      <span className="min-w-0">
        <span className="block text-xs text-ink-soft">מועד הפרישה הקרוב · טיוטה לבדיקה</span>
        <span className="block text-ink">
          {fmt(nextPrishah.hdate, { year: false })} ·{' '}
          {nextPrishah.onah === 'day' ? 'עונת יום' : 'עונת לילה'}
        </span>
      </span>
      <Icon name="chevron" className="size-4 shrink-0 text-ink-faint" />
    </Link>
  ) : null;

  if (t.stage === 'none' || t.stage === 'bleeding' || t.stage === 'awaiting-hefsek') {
    const text =
      t.stage === 'bleeding'
        ? 'המחזור האחרון עדיין פתוח בתיעוד. כשהדימום יסתיים, אפשר לתעד הפסק טהרה ולעקוב כאן אחר שבעה נקיים.'
        : t.stage === 'awaiting-hefsek'
          ? 'טרם תועד הפסק טהרה אחרי המחזור האחרון.'
          : 'כאן תוכלי לתעד הפסק טהרה, בדיקות שבעה נקיים וטבילה, במקום אחד ודיסקרטי.';
    return (
      <Card className="border-gold-soft/70">
        {header}
        <p className="text-sm leading-relaxed text-ink-soft">{text}</p>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => open({ kind: 'hefsek' })}>
            תיעוד הפסק טהרה
          </Button>
        </div>
        {prishahLine}
      </Card>
    );
  }

  return (
    <Card className="border-gold-soft/70">
      {header}
      {t.stage === 'after-tevila' && t.tevila?.actual ? (
        <p className="text-[0.95rem] text-ink">
          הטבילה תועדה ב{fmt(t.tevila.actual, { year: false })}.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-ink-soft">הפסק טהרה</p>
              <p className="mt-1 text-lg text-ink">
                {t.hefsek ? fmt(t.hefsek.date, { year: false }) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">ימים שתיעדת</p>
              <p className="mt-1 font-display font-black tracking-tight text-2xl text-ink">
                {t.documentedDays}
                <span className="ms-1 font-sans text-sm text-ink-soft">מתוך {SEVEN}</span>
              </p>
            </div>
          </div>
          <ol
            className="mt-4 flex gap-1.5"
            aria-label={`תועדו ${t.documentedDays} מתוך ${SEVEN} ימים`}
          >
            {t.slots.map((s) => {
              const done = !!(s.morning || s.evening);
              return (
                <li
                  key={s.day}
                  className={cn('h-2 flex-1 rounded-full', done ? 'bg-gold' : 'bg-gold-soft/60')}
                />
              );
            })}
          </ol>
          <p className="mt-2 text-xs text-ink-faint">
            {t.remainingToDocument > 0
              ? `נותרו ${t.remainingToDocument} ימים לתיעוד. `
              : 'תיעדת את כל שבעת הימים. '}
            הספירה מבוססת על התיעוד שלך בלבד.
          </p>
          <div className="mt-4 rounded-xl bg-surface-muted px-3 py-2.5 text-sm text-ink-soft">
            {t.tevila?.planned
              ? `טבילה מתוכננת: ${fmt(t.tevila.planned, { year: false })}`
              : 'עדיין לא נקבע תאריך טבילה.'}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {t.stage === 'seven-days' ? (
              <Button onClick={() => open({ kind: 'bedika' })}>תיעוד בדיקה</Button>
            ) : null}
            <Button variant="secondary" onClick={() => open({ kind: 'tevila' })}>
              {t.tevila?.planned ? 'עדכון טבילה' : 'קביעת תאריך טבילה'}
            </Button>
          </div>
        </>
      )}
      {prishahLine}
    </Card>
  );
}
