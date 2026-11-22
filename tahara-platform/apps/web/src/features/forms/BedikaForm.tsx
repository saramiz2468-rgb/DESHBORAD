'use client';

import { useState } from 'react';
import { Button, Notice } from '@tahara/ui';
import type { ISODate } from '@tahara/core/calendar';
import { BEDIKA_RESULT_LABELS } from '@/domain/labels';
import type { Bedika, BedikaPart, BedikaResult, Hefsek } from '@/domain/types';
import { newId, useTahara } from '@/state/store';
import { DateInput, Field, FormActions, Segmented, TextArea } from '@/components/app/fields';
import { trimOrUndefined, useFormState } from './useFormState';

const RESULTS = (Object.keys(BEDIKA_RESULT_LABELS) as BedikaResult[]).map((v) => ({
  value: v,
  label: BEDIKA_RESULT_LABELS[v],
}));
const DAYS = Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

export function BedikaForm({
  hefsek,
  day,
  part,
  onDone,
}: {
  hefsek: Hefsek;
  day?: number | undefined;
  part?: BedikaPart | undefined;
  onDone: () => void;
}) {
  const { data, today, save, remove } = useTahara();
  const [error, setError] = useState<string>();
  const find = (d: number, p: BedikaPart) =>
    data.bedikot.find((b) => b.hefsekId === hefsek.id && b.day === d && b.part === p);
  const sibling = (d: number, p: BedikaPart) => find(d, p === 'morning' ? 'evening' : 'morning');
  const nextFree = () => {
    for (let d = 1; d <= 7; d++)
      for (const p of ['morning', 'evening'] as const) if (!find(d, p)) return { d, p };
    return { d: 7, p: 'evening' as const };
  };
  const start = day && part ? { d: day, p: part } : nextFree();
  const initialExisting = find(start.d, start.p);

  const { state: s, update } = useFormState(null, () => ({
    day: String(start.d),
    part: start.p as BedikaPart,
    date: (initialExisting?.date ?? sibling(start.d, start.p)?.date ?? today) as ISODate,
    result: (initialExisting?.result ?? 'clean') as BedikaResult,
    notes: initialExisting?.notes ?? '',
  }));
  const existing: Bedika | undefined = find(Number(s.day), s.part);
  // Switching slot loads what was already documented there (or sensible defaults).
  const select = (d: number, p: BedikaPart) => {
    const hit = find(d, p);
    update({
      day: String(d),
      part: p,
      date: hit?.date ?? sibling(d, p)?.date ?? s.date,
      result: hit?.result ?? 'clean',
      notes: hit?.notes ?? '',
    });
  };

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (s.date > today) return setError('אי אפשר לתעד תאריך עתידי');
        if (s.date < hefsek.date) return setError('התאריך קודם להפסק הטהרה');
        save(
          'bedikot',
          {
            id: existing?.id ?? newId(),
            hefsekId: hefsek.id,
            day: Number(s.day),
            part: s.part,
            date: s.date,
            result: s.result,
            notes: trimOrUndefined(s.notes),
          },
          'הבדיקה תועדה',
        );
        onDone();
      }}
    >
      <Segmented
        label="יום בתהליך (לפי סימונך)"
        value={s.day}
        options={DAYS}
        onChange={(v) => v && select(Number(v), s.part)}
      />
      <Segmented
        label="בדיקה"
        value={s.part}
        options={[
          { value: 'morning', label: 'בוקר' },
          { value: 'evening', label: 'ערב' },
        ]}
        onChange={(v) => v && select(Number(s.day), v)}
      />
      <Field label="תאריך הבדיקה" error={error}>
        {(p) => (
          <DateInput
            {...p}
            min={hefsek.date}
            max={today}
            value={s.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        )}
      </Field>
      <Segmented
        label="תוצאה כפי שתיעדת"
        value={s.result}
        options={RESULTS}
        onChange={(v) => v && update({ result: v })}
      />
      <Field label="הערות" optional>
        {(p) => (
          <TextArea
            {...p}
            maxLength={500}
            value={s.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
        )}
      </Field>
      <Notice>
        הסימון הוא תיעוד בלבד. האפליקציה אינה קובעת אם היום נחשב או הושלם. בכל שאלה יש להתייעץ עם
        רב.
      </Notice>
      <FormActions>
        {existing ? (
          <Button
            variant="ghost"
            onClick={() => {
              remove('bedikot', existing.id, 'התיעוד נמחק');
              onDone();
            }}
          >
            מחיקת התיעוד
          </Button>
        ) : null}
        <Button type="submit" className="sm:min-w-40">
          {existing ? 'עדכון' : 'שמירה'}
        </Button>
      </FormActions>
    </form>
  );
}
