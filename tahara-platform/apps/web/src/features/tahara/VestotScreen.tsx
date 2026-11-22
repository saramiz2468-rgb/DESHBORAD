'use client';

import { Card, Notice, PageHeader, StatusBadge } from '@tahara/ui';
import { compareDates } from '@tahara/core/calendar';
import { EmptyState, SectionTitle } from '@/components/app/bits';
import { Icon } from '@/components/Icon';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';
import { TaharaTabs } from './TaharaScreen';

/**
 * Candidate rules from the prototype. None is approved, so the engine does not
 * run and no date is shown. See docs/halacha-rules-governance.md.
 */
const CANDIDATE_RULES = [
  { id: 'veset-hachodesh', name: 'וסת החודש' },
  { id: 'veset-haflaga', name: 'וסת ההפלגה' },
  { id: 'onah-beinonit', name: 'עונה בינונית' },
  { id: 'onah-day-night', name: 'עונת יום / עונת לילה' },
  { id: 'ohr-zarua', name: 'אור זרוע (לפי הגדרות)' },
] as const;

const ANATOMY = [
  'שם הכלל',
  'תאריך עברי',
  'תאריך לועזי',
  'יום או לילה',
  'הסבר קצר לאופן החישוב',
  'מקור וגרסת הכלל שאושרה',
];

export function VestotScreen() {
  const { data } = useTahara();
  const { fmt } = useDerived();
  const sightings = [...data.periods].sort((a, b) => compareDates(b.start, a.start));

  return (
    <div>
      <PageHeader title="טהרה" description="מעקב וסתות לפי כללים שאושרו." />
      <TaharaTabs active="vestot" />
      <Notice tone="caution" title="החישובים עדיין לא פעילים" className="mb-5">
        מועדי וסתות יחושבו ויוצגו רק אחרי שגורם הלכתי מוסמך יבדוק ויאשר כל כלל. גם אז הם יהיו כלי
        עזר בלבד ולא פסק הלכה.
      </Notice>

      <section className="mb-6">
        <SectionTitle>כללים</SectionTitle>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {CANDIDATE_RULES.map((r) => (
            <li key={r.id}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <span className="text-[0.95rem] text-ink">{r.name}</span>
                <StatusBadge status="locked" />
              </Card>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-faint">
          כל כלל יסומן כפעיל רק לאחר אישור, עם שם הגורם המאשר ותאריך האישור.
        </p>
      </section>

      <section className="mb-6">
        <SectionTitle>כך תוצג כל תוצאה</SectionTitle>
        <Card className="border-dashed">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {ANATOMY.map((a) => (
              <div key={a}>
                <dt className="text-xs text-ink-soft">{a}</dt>
                <dd className="mt-1 text-ink-faint" aria-label="אין ערך">
                  —
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-ink-faint">מבנה התצוגה בלבד. אין כאן ערכים מחושבים.</p>
        </Card>
      </section>

      <section>
        <SectionTitle>היסטוריית ראיות שתועדו</SectionTitle>
        {sightings.length ? (
          <Card className="p-0 sm:p-0">
            <ul className="divide-y divide-line">
              {sightings.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-ink">{fmt(p.start)}</span>
                  <span className="text-xs text-ink-soft" dir="ltr">
                    {p.startTime ?? 'ללא שעה'}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-4 py-3 text-xs text-ink-faint">
              רשימת התיעוד שלך. סיווג עונה (יום או לילה) יוצג רק לאחר אישור הכלל.
            </p>
          </Card>
        ) : (
          <EmptyState
            icon={<Icon name="moon" className="size-6" />}
            title="אין עדיין תיעוד"
            text="תחילות מחזור שתתעדי, כולל השעה אם תוסיפי, יופיעו כאן."
          />
        )}
      </section>
    </div>
  );
}
