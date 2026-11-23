'use client';

import { useMemo, useState } from 'react';
import { Button, PageHeader, cn } from '@tahara/ui';
import {
  addMonths,
  formatGregorianMonth,
  formatHebrewDay,
  formatHebrewMonth,
  monthGrid,
  startOfMonth,
  toHebrewDate,
  WEEKDAYS_SHORT,
  type DateDisplay,
  type ISODate,
} from '@tahara/core/calendar';
import { Icon } from '@/components/Icon';
import { Segmented } from '@/components/app/fields';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';
import { dayInfo, EVENT_LEGEND, type DayInfo, type EventKind } from './dayEvents';
import { DaySheet } from './DaySheet';

const DISPLAY_OPTIONS: ReadonlyArray<{ value: DateDisplay; label: string }> = [
  { value: 'hebrew', label: 'עברי' },
  { value: 'gregorian', label: 'לועזי' },
  { value: 'both', label: 'משולב' },
];

export function CalendarScreen() {
  const { data, today } = useTahara();
  const { prediction, vestot } = useDerived();
  const [month, setMonth] = useState<ISODate>(startOfMonth(today));
  const [display, setDisplay] = useState<DateDisplay>(data.preferences.dateDisplay);
  const [selected, setSelected] = useState<ISODate | null>(null);

  const weeks = useMemo(() => monthGrid(month), [month]);
  const infos = useMemo(() => {
    const m = new Map<ISODate, DayInfo>();
    for (const d of weeks.flat()) m.set(d, dayInfo(d, data, prediction, today, vestot.prishot));
    return m;
  }, [weeks, data, prediction, today, vestot]);

  const inMonth = (d: ISODate) => d.slice(0, 7) === month.slice(0, 7);
  const monthDays = weeks.flat().filter(inMonth);
  const hebrewSpan = [...new Set(monthDays.map((d) => formatHebrewMonth(d)))];
  const title =
    display === 'hebrew'
      ? hebrewSpan.join(' – ')
      : display === 'both'
        ? `${formatGregorianMonth(month)}`
        : formatGregorianMonth(month);

  return (
    <div>
      <PageHeader title="לוח שנה" description="כל התיעוד וההערכות שלך במבט חודשי." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="תצוגת תאריכים"
          value={display}
          options={DISPLAY_OPTIONS}
          onChange={(v) => v && setDisplay(v)}
        />
      </div>

      <section
        aria-label="לוח חודשי"
        className="rounded-card border border-line bg-surface p-3 shadow-soft sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, -1))}
            aria-label="החודש הקודם"
            className="grid size-11 place-items-center rounded-full text-ink-soft hover:bg-surface-muted"
          >
            <Icon name="chevronNext" />
          </button>
          <div className="min-w-0 text-center">
            <h2 className="font-display text-xl text-plum" aria-live="polite">
              {title}
            </h2>
            {display === 'both' ? (
              <p className="text-xs text-ink-faint">{hebrewSpan.join(' – ')}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            aria-label="החודש הבא"
            className="grid size-11 place-items-center rounded-full text-ink-soft hover:bg-surface-muted"
          >
            <Icon name="chevron" />
          </button>
        </div>
        <div className="mb-3 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            className="min-h-9 px-3 text-sm"
            onClick={() => setMonth(addMonths(month, -12))}
          >
            שנה קודמת
          </Button>
          <Button
            variant="secondary"
            className="min-h-9 px-4 text-sm"
            onClick={() => setMonth(startOfMonth(today))}
          >
            היום
          </Button>
          <Button
            variant="ghost"
            className="min-h-9 px-3 text-sm"
            onClick={() => setMonth(addMonths(month, 12))}
          >
            שנה הבאה
          </Button>
        </div>

        <table className="w-full table-fixed border-separate border-spacing-0.5 sm:border-spacing-1">
          <thead>
            <tr>
              {WEEKDAYS_SHORT.map((w) => (
                <th
                  key={w}
                  scope="col"
                  className="pb-2 text-center text-xs font-medium text-ink-faint"
                >
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0]}>
                {week.map((d) => (
                  <td key={d} className="p-0">
                    <DayCell
                      date={d}
                      info={infos.get(d)!}
                      display={display}
                      muted={!inMonth(d)}
                      isToday={d === today}
                      onSelect={() => setSelected(d)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Legend />

      <DaySheet
        date={selected}
        info={
          selected
            ? (infos.get(selected) ?? dayInfo(selected, data, prediction, today, vestot.prishot))
            : null
        }
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function DayCell({
  date,
  info,
  display,
  muted,
  isToday,
  onSelect,
}: {
  date: ISODate;
  info: DayInfo;
  display: DateDisplay;
  muted: boolean;
  isToday: boolean;
  onSelect: () => void;
}) {
  const k = info.kinds;
  const greg = String(Number(date.slice(8)));
  const heb = formatHebrewDay(date);
  const primary = display === 'hebrew' ? heb : greg;
  const secondary = display === 'both' ? heb : null;
  const label = [
    display === 'gregorian' ? '' : `${heb} ב${toHebrewDate(date).month}`,
    display === 'hebrew' ? '' : `${greg}.${Number(date.slice(5, 7))}`,
    ...EVENT_LEGEND.filter((e) => k.has(e.kind)).map((e) => e.label),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      className={cn(
        'relative flex aspect-square w-full flex-col items-center justify-center rounded-xl text-sm transition-colors sm:aspect-[1/0.9]',
        muted ? 'text-ink-faint/60' : 'text-ink',
        k.has('bleed')
          ? 'bg-[color-mix(in_oklab,var(--ev-bleed)_18%,transparent)]'
          : 'hover:bg-surface-muted',
        k.has('expected') &&
          !k.has('bleed') &&
          'outline-dashed outline-[1.5px] -outline-offset-2 outline-[var(--ev-bleed)]',
        isToday && 'ring-2 ring-plum ring-offset-1 ring-offset-surface',
      )}
    >
      <span className={cn('leading-none', isToday && 'font-semibold')}>{primary}</span>
      {secondary ? (
        <span className="mt-0.5 text-[0.6rem] leading-none text-ink-faint">{secondary}</span>
      ) : null}
      <span
        className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-0.5"
        aria-hidden
      >
        {k.has('hefsek') ? <Dot kind="hefsek" /> : null}
        {k.has('clean') ? <Dot kind="clean" /> : null}
        {k.has('tevila') ? <Dot kind="tevila" shape="ring" /> : null}
        {k.has('ovulation') ? <Dot kind="ovulation" shape="diamond" /> : null}
        {k.has('veset') ? <Dot kind="veset" shape="square" /> : null}
        {k.has('kavua') ? <Dot kind="kavua" shape="square-ring" /> : null}
      </span>
      {k.has('sighting') ? (
        <span
          aria-hidden
          className="absolute end-1 top-1 size-0 border-x-[4px] border-t-[6px] border-x-transparent border-t-[var(--ev-sighting)]"
        />
      ) : null}
      {k.has('fertile') ? (
        <span
          aria-hidden
          className="absolute inset-x-2 top-1 h-[3px] rounded-full bg-[var(--ev-fertile)]"
        />
      ) : null}
    </button>
  );
}

function Dot({
  kind,
  shape = 'dot',
}: {
  kind: EventKind;
  shape?: 'dot' | 'ring' | 'diamond' | 'square' | 'square-ring';
}) {
  const color = `var(--ev-${kind})`;
  if (shape === 'square')
    return <span className="size-2 rounded-[2px]" style={{ background: color }} />;
  if (shape === 'square-ring')
    return <span className="size-2.5 rounded-[2px] border-2" style={{ borderColor: color }} />;
  if (shape === 'ring')
    return <span className="size-2 rounded-full border-2" style={{ borderColor: color }} />;
  if (shape === 'diamond')
    return <span className="size-2 rotate-45 rounded-[1px]" style={{ background: color }} />;
  return <span className="size-1.5 rounded-full" style={{ background: color }} />;
}

function Legend() {
  return (
    <section
      aria-label="מקרא"
      className="mt-4 rounded-card border border-line bg-surface p-4 shadow-soft"
    >
      <h2 className="mb-3 text-sm font-semibold text-ink">מקרא</h2>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-2.5 text-[0.8rem] text-ink-soft sm:grid-cols-2">
        {EVENT_LEGEND.map((e) => (
          <li key={e.kind} className="flex items-center gap-2.5">
            <LegendSwatch kind={e.kind} />
            <span>
              {e.label}
              {e.note ? <span className="text-ink-faint"> · {e.note}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LegendSwatch({ kind }: { kind: EventKind }) {
  const box = 'grid size-6 shrink-0 place-items-center rounded-md';
  switch (kind) {
    case 'bleed':
      return (
        <span
          className={box}
          style={{ background: 'color-mix(in oklab, var(--ev-bleed) 18%, transparent)' }}
        />
      );
    case 'expected':
      return (
        <span
          className={cn(
            box,
            'outline-dashed outline-[1.5px] -outline-offset-2 outline-[var(--ev-bleed)]',
          )}
        />
      );
    case 'fertile':
      return (
        <span className={box}>
          <span className="h-[3px] w-4 rounded-full bg-[var(--ev-fertile)]" />
        </span>
      );
    case 'tevila':
      return (
        <span className={box}>
          <Dot kind="tevila" shape="ring" />
        </span>
      );
    case 'ovulation':
      return (
        <span className={box}>
          <Dot kind="ovulation" shape="diamond" />
        </span>
      );
    case 'veset':
      return (
        <span className={box}>
          <Dot kind="veset" shape="square" />
        </span>
      );
    case 'kavua':
      return (
        <span className={box}>
          <Dot kind="kavua" shape="square-ring" />
        </span>
      );
    case 'sighting':
      return (
        <span className={box}>
          <span className="size-0 border-x-[5px] border-t-[8px] border-x-transparent border-t-[var(--ev-sighting)]" />
        </span>
      );
    default:
      return (
        <span className={box}>
          <Dot kind={kind} />
        </span>
      );
  }
}
