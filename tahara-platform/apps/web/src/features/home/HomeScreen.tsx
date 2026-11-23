'use client';

import Link from 'next/link';
import { Button, Card, cn } from '@tahara/ui';
import { bleedLength } from '@tahara/core/medical-engine';
import { Icon, type IconName } from '@/components/Icon';
import { EstimateTag, ProgressRing, Stat } from '@/components/app/bits';
import { useSheets, type SheetRequest } from '@/features/forms/ActionSheets';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';
import { TaharaCard } from './TaharaCard';

export function HomeScreen() {
  const { data, today } = useTahara();
  const { prediction: p, stats, fmt } = useDerived();
  const { open } = useSheets();
  const hasAny =
    data.periods.length +
      data.hefseks.length +
      data.fertilityLogs.length +
      data.symptomLogs.length >
    0;

  return (
    <div className="space-y-5">
      <header className="mb-2">
        <h1 className="font-display font-black tracking-tight text-[2rem] leading-tight text-plum">
          שלום לך 🌸
        </h1>
        <p className="mt-1 text-[0.95rem] text-ink-soft">{fmt(today, { weekday: true })}</p>
      </header>

      {!hasAny ? <Welcome /> : null}

      {data.periods.length ? <CycleCard /> : null}

      <TaharaCard />

      {p.fertileWindow && p.ovulation ? (
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold text-ink">
              <Icon name="fertility" className="size-5 text-rose" />
              פוריות
            </h2>
            <EstimateTag />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Stat
              label="חלון פוריות משוער"
              value={
                <span className="text-lg">
                  {fmt(p.fertileWindow[0], { year: false })} –{' '}
                  {fmt(p.fertileWindow[1], { year: false })}
                </span>
              }
            />
            <Stat
              label="ביוץ משוער"
              value={<span className="text-lg">{fmt(p.ovulation, { year: false })}</span>}
            />
            <Stat
              label="ימים עד הביוץ"
              value={
                p.daysUntilOvulation === null
                  ? null
                  : p.daysUntilOvulation > 0
                    ? p.daysUntilOvulation
                    : p.daysUntilOvulation === 0
                      ? 'היום'
                      : 'עבר'
              }
              {...(p.daysUntilOvulation && p.daysUntilOvulation > 0 ? { unit: 'ימים' } : {})}
            />
            <Stat
              label="מחזור צפוי"
              value={
                p.nextStart ? (
                  <span className="text-lg">{fmt(p.nextStart, { year: false })}</span>
                ) : null
              }
            />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            {p.ovulationSource === 'lh' ? 'לפי בדיקת ביוץ חיובית שתיעדת. ' : 'לפי אורך המחזור. '}
            הערכה סטטיסטית בלבד. לא אבחון רפואי ולא אמצעי למניעת היריון.
          </p>
          <Link
            href="/fertility"
            className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-rose hover:underline"
          >
            לפוריות וביוץ
            <Icon name="chevron" className="size-4" />
          </Link>
        </Card>
      ) : null}

      <QuickActions onOpen={open} />

      {stats.count === 0 && data.periods.length > 0 && !data.preferences.declaredCycleLength ? (
        <p className="text-center text-xs text-ink-faint">
          תחזיות יוצגו אחרי שני מחזורים, או אם תגדירי אורך מחזור ב
          <Link href="/settings" className="text-rose underline-offset-2 hover:underline">
            הגדרות
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}

function Welcome() {
  const { open } = useSheets();
  return (
    <Card className="relative overflow-hidden bg-gradient-to-bl from-blush/80 via-surface to-surface">
      <div
        aria-hidden
        className="absolute -top-10 -start-10 size-40 rounded-full bg-blush blur-2xl"
      />
      <div className="relative">
        <h2 className="font-display font-black tracking-tight text-2xl text-plum">ברוכה הבאה</h2>
        <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
          כאן תופיע תמונת המצב האישית שלך. כדי להתחיל, אפשר לתעד את המחזור האחרון או להגדיר את אורך
          המחזור הרגיל שלך.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => open({ kind: 'period' })}>
            <Icon name="plus" className="size-4" />
            תיעוד המחזור האחרון
          </Button>
          <Link
            href="/settings"
            className="inline-flex min-h-12 items-center justify-center rounded-pill border border-line bg-surface px-6 text-[0.95rem] font-medium text-ink hover:border-rose-soft"
          >
            הגדרת אורך מחזור
          </Link>
        </div>
      </div>
    </Card>
  );
}

function CycleCard() {
  const { data } = useTahara();
  const { prediction: p, stats, fmt } = useDerived();
  const { open } = useSheets();
  const last = [...data.periods].sort((a, b) => (a.start < b.start ? 1 : -1))[0]!;
  const bleed = bleedLength(last);
  const avg =
    p.basis === 'history' ? stats.averageLength : p.basis === 'declared' ? p.cycleLength : null;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <Icon name="calendar" className="size-5 text-rose" />
          המחזור שלי
        </h2>
        <Button
          variant="ghost"
          className="min-h-9 px-3 text-sm"
          onClick={() => open({ kind: 'period', existing: last })}
        >
          עדכון
        </Button>
      </div>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <ProgressRing
          value={p.dayOfCycle ?? 0}
          max={p.cycleLength ?? Math.max(28, p.dayOfCycle ?? 0)}
          label={`יום ${p.dayOfCycle} במחזור`}
        >
          <div>
            <p className="text-xs text-ink-soft">יום</p>
            <p className="font-display font-black tracking-tight text-4xl leading-none text-plum">
              {p.dayOfCycle}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {p.cycleLength ? `מתוך ~${p.cycleLength}` : 'במחזור'}
            </p>
          </div>
        </ProgressRing>
        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-5">
          <Stat
            label="תחילת המחזור האחרון"
            value={<span className="text-lg">{fmt(last.start, { year: false })}</span>}
          />
          <Stat
            label="ימי דימום"
            value={bleed ?? (last.end ? null : 'פתוח')}
            {...(bleed ? { unit: 'ימים' } : {})}
          />
          <Stat
            label={p.basis === 'declared' ? 'אורך מחזור (שהגדרת)' : 'אורך מחזור ממוצע'}
            value={avg}
            unit="ימים"
          />
          <Stat
            label="המחזור הבא"
            estimate={!!p.nextStart}
            value={
              p.nextStart ? (
                <span className="text-lg">{fmt(p.nextStart, { year: false })}</span>
              ) : null
            }
          />
        </div>
      </div>
      {p.late ? (
        <p className="mt-4 rounded-xl bg-surface-muted px-3 py-2 text-sm text-ink-soft">
          המועד המשוער עבר ועדיין לא תועד מחזור חדש. זה קורה, וההערכה תתעדכן כשתתעדי.
        </p>
      ) : null}
      {p.irregular ? (
        <p className="mt-4 rounded-xl bg-surface-muted px-3 py-2 text-sm text-ink-soft">
          אורכי המחזור שלך משתנים, ולכן טווח ההערכה רחב יותר (
          {p.nextStartRange
            ? `${fmt(p.nextStartRange[0], { year: false })} – ${fmt(p.nextStartRange[1], { year: false })}`
            : ''}
          ).
        </p>
      ) : null}
    </Card>
  );
}

function QuickActions({ onOpen }: { onOpen: (r: SheetRequest) => void }) {
  const { tahara } = useDerived();
  const noHefsek = !tahara.hefsek;
  const actions: Array<{ label: string; icon: IconName; req: SheetRequest; disabled?: string }> = [
    { label: 'תיעוד מחזור', icon: 'drop', req: { kind: 'period' } },
    {
      label: 'תיעוד בדיקה',
      icon: 'check',
      req: { kind: 'bedika' },
      ...(noHefsek ? { disabled: 'אחרי הפסק טהרה' } : {}),
    },
    { label: 'הפסק טהרה', icon: 'sparkle', req: { kind: 'hefsek' } },
    { label: 'תיעוד תסמין', icon: 'symptom', req: { kind: 'symptom' } },
    { label: 'בדיקת ביוץ', icon: 'flask', req: { kind: 'fertility', focus: 'lh' } },
  ];
  return (
    <section aria-labelledby="quick">
      <h2 id="quick" className="mb-3 text-[0.95rem] font-semibold text-ink">
        פעולות מהירות
      </h2>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            disabled={!!a.disabled}
            onClick={() => onOpen(a.req)}
            className={cn(
              'flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-2 py-3 text-center text-[0.8rem] text-ink shadow-soft transition',
              'hover:-translate-y-0.5 hover:border-rose-soft disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55',
            )}
          >
            <span className="grid size-10 place-items-center rounded-full bg-blush text-rose">
              <Icon name={a.icon} />
            </span>
            <span className="leading-tight">{a.label}</span>
            {a.disabled ? (
              <span className="text-[0.65rem] text-ink-faint">{a.disabled}</span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
