'use client';

import type { ReactNode } from 'react';
import { Button } from '@tahara/ui';
import { bleedLength } from '@tahara/core/medical-engine';
import type { ISODate } from '@tahara/core/calendar';
import { ONAH_LABEL } from '@tahara/core/halacha-engine';
import { BEDIKA_RESULT_LABELS, FLOW_LABELS, MUCUS_LABELS, SYMPTOM_LABELS } from '@/domain/labels';
import { Sheet } from '@/components/app/Sheet';
import { EstimateTag } from '@/components/app/bits';
import { useSheets } from '@/features/forms/ActionSheets';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';
import type { DayInfo } from './dayEvents';

export function DaySheet({
  date,
  info,
  onClose,
}: {
  date: ISODate | null;
  info: DayInfo | null;
  onClose: () => void;
}) {
  const { today } = useTahara();
  const { fmt } = useDerived();
  const { open } = useSheets();
  if (!date || !info)
    return (
      <Sheet open={false} onClose={onClose} title="">
        {null}
      </Sheet>
    );
  const future = date > today;
  const go = (fn: () => void) => {
    onClose();
    fn();
  };
  const k = info.kinds;
  const nothing =
    !info.periods.length &&
    !info.sightings.length &&
    !info.prishot.length &&
    !info.hefseks.length &&
    !info.bedikot.length &&
    !info.tevilot.length &&
    !info.symptoms.length &&
    !info.fertility.length &&
    !k.has('fertile') &&
    !k.has('ovulation') &&
    !k.has('expected');

  return (
    <Sheet open onClose={onClose} title={fmt(date, { weekday: true })}>
      <div className="space-y-3">
        {nothing ? <p className="text-sm text-ink-soft">אין תיעוד ביום הזה.</p> : null}

        {info.periods.map((p) => (
          <Row
            key={p.id}
            color="var(--ev-bleed)"
            title="דימום"
            onEdit={() => go(() => open({ kind: 'period', existing: p }))}
          >
            התחלה {fmt(p.start, { year: false })}
            {bleedLength(p) ? ` · ${bleedLength(p)} ימים` : ''}
            {p.flow ? ` · ${FLOW_LABELS[p.flow]}` : ''}
          </Row>
        ))}
        {info.symptoms.map((s) => (
          <Row
            key={s.id}
            color="var(--tk-rose-soft)"
            title="תסמינים"
            onEdit={() => go(() => open({ kind: 'symptom', existing: s }))}
          >
            {s.symptoms.map((x) => SYMPTOM_LABELS[x]).join(', ') || s.notes}
          </Row>
        ))}
        {info.fertility.map((f) => (
          <Row
            key={f.id}
            color="var(--ev-fertile)"
            title="תיעוד פוריות"
            onEdit={() => go(() => open({ kind: 'fertility', existing: f }))}
          >
            {[
              f.lh ? `בדיקת ביוץ ${f.lh === 'positive' ? 'חיובית' : 'שלילית'}` : '',
              f.bbt ? `חום ${f.bbt}°` : '',
              f.mucus ? `הפרשות: ${MUCUS_LABELS[f.mucus]}` : '',
              f.ovulationPain ? 'כאבי ביוץ' : '',
            ]
              .filter(Boolean)
              .join(' · ') || f.notes}
          </Row>
        ))}
        {info.hefseks.map((h) => (
          <Row
            key={h.id}
            color="var(--ev-hefsek)"
            title="הפסק טהרה"
            onEdit={() => go(() => open({ kind: 'hefsek', existing: h }))}
          >
            {h.time ? `בשעה ${h.time}` : 'תועד'}
            {h.performed ? '' : ' · טרם בוצע'}
          </Row>
        ))}
        {info.bedikot.map((b) => (
          <Row
            key={b.id}
            color="var(--ev-clean)"
            title={`בדיקה · יום ${b.day} · ${b.part === 'morning' ? 'בוקר' : 'ערב'}`}
            onEdit={() => go(() => open({ kind: 'bedika', day: b.day, part: b.part }))}
          >
            {BEDIKA_RESULT_LABELS[b.result]} (כפי שתיעדת)
          </Row>
        ))}
        {info.sightings.map((x) => (
          <Row
            key={x.id}
            color="var(--ev-sighting)"
            title="תחילת ראייה"
            onEdit={() => go(() => open({ kind: 'sighting', existing: x }))}
          >
            {x.time ? `בשעה ${x.time}` : 'ללא שעה'}
          </Row>
        ))}
        {info.prishot.map((p) => (
          <Row
            key={p.hdate + p.onah}
            color="var(--ev-veset)"
            title={`מועד פרישה · ${ONAH_LABEL[p.onah]}`}
            draft
          >
            {p.entries.map((e) => e.label).join(' · ')} · {p.window.from.time}–{p.window.to.time}
          </Row>
        ))}
        {info.tevilot.map(({ tevila, type }) => (
          <Row
            key={tevila.id + type}
            color="var(--ev-tevila)"
            title={type === 'actual' ? 'טבילה' : 'טבילה מתוכננת'}
            onEdit={() => go(() => open({ kind: 'tevila' }))}
          >
            {type === 'actual' ? 'בוצעה' : 'התאריך שקבעת'}
          </Row>
        ))}
        {k.has('expected') ? (
          <Row color="var(--ev-bleed)" title="מחזור צפוי" estimate>
            לפי אורך המחזור
          </Row>
        ) : null}
        {k.has('ovulation') ? (
          <Row color="var(--ev-ovulation)" title="ביוץ משוער" estimate>
            לא אבחון רפואי
          </Row>
        ) : null}
        {k.has('fertile') && !k.has('ovulation') ? (
          <Row color="var(--ev-fertile)" title="חלון פוריות משוער" estimate>
            לא אמצעי למניעת היריון
          </Row>
        ) : null}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        {future ? (
          <p className="text-sm text-ink-faint">אי אפשר לתעד תאריך עתידי.</p>
        ) : (
          <>
            <p className="mb-3 text-sm font-medium text-ink">הוספה ליום הזה</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => go(() => open({ kind: 'period', date }))}>
                תחילת מחזור
              </Button>
              <Button variant="secondary" onClick={() => go(() => open({ kind: 'symptom', date }))}>
                תסמין
              </Button>
              <Button
                variant="secondary"
                onClick={() => go(() => open({ kind: 'fertility', date }))}
              >
                תיעוד פוריות
              </Button>
              <Button variant="secondary" onClick={() => go(() => open({ kind: 'hefsek', date }))}>
                הפסק טהרה
              </Button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

function Row({
  draft,
  color,
  title,
  children,
  onEdit,
  estimate,
}: {
  color: string;
  title: string;
  children: ReactNode;
  onEdit?: () => void;
  estimate?: boolean;
  draft?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line px-3.5 py-3">
      <span aria-hidden className="h-9 w-1 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          {title}
          {estimate ? <EstimateTag /> : null}
          {draft ? (
            <span className="rounded-pill bg-gold-soft px-2 py-0.5 text-[0.7rem] text-ink-soft">
              טיוטה
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-ink-soft">{children}</p>
      </div>
      {onEdit ? (
        <Button variant="ghost" className="min-h-9 px-3 text-sm" onClick={onEdit}>
          עריכה
        </Button>
      ) : null}
    </div>
  );
}
