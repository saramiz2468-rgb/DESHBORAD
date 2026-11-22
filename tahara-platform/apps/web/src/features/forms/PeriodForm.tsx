'use client';

import { useState } from 'react';
import { Button } from '@tahara/ui';
import { diffDays, type ISODate } from '@tahara/core/calendar';
import { validatePeriod } from '@tahara/core/medical-engine';
import { FLOW_LABELS, SYMPTOM_LABELS } from '@/domain/labels';
import type { Flow, Period, SymptomKey } from '@/domain/types';
import { newId, useTahara } from '@/state/store';
import {
  ChipGroup,
  DateInput,
  Field,
  FormActions,
  Segmented,
  TextArea,
  TextInput,
  TimeInput,
} from '@/components/app/fields';
import { ConfirmDialog } from '@/components/app/ConfirmDialog';
import { optionalNumber, trimOrUndefined, useFormState } from './useFormState';

const FLOW_OPTIONS = (Object.keys(FLOW_LABELS) as Flow[]).map((v) => ({
  value: v,
  label: FLOW_LABELS[v],
}));
export const SYMPTOM_OPTIONS = (Object.keys(SYMPTOM_LABELS) as SymptomKey[]).map((v) => ({
  value: v,
  label: SYMPTOM_LABELS[v],
}));

interface State {
  start: ISODate;
  startTime: string;
  end: string;
  flow: Flow | undefined;
  bleedDays: string;
  symptoms: SymptomKey[];
  otherSymptom: string;
  notes: string;
}

export function PeriodForm({
  existing,
  date,
  onDone,
}: {
  existing?: Period | undefined;
  date?: ISODate | undefined;
  onDone: () => void;
}) {
  const { data, today, save, remove } = useTahara();
  const [errors, setErrors] = useState<Partial<Record<'start' | 'end' | 'bleedDays', string>>>({});
  const [confirm, setConfirm] = useState(false);
  const {
    state: s,
    update,
    clear,
    hasDraft,
  } = useFormState<State>(existing ? null : 'new-period', () => ({
    start: existing?.start ?? date ?? today,
    startTime: existing?.startTime ?? '',
    end: existing?.end ?? '',
    flow: existing?.flow,
    bleedDays: existing?.bleedDays ? String(existing.bleedDays) : '',
    symptoms: existing?.symptoms ?? [],
    otherSymptom: existing?.otherSymptom ?? '',
    notes: existing?.notes ?? '',
  }));

  const autoBleed = s.end && s.end >= s.start ? diffDays(s.start, s.end) + 1 : null;

  function submit() {
    const item: Period = {
      id: existing?.id ?? newId(),
      start: s.start,
      startTime: trimOrUndefined(s.startTime),
      end: trimOrUndefined(s.end),
      bleedDays: autoBleed ?? optionalNumber(s.bleedDays),
      flow: s.flow,
      symptoms: s.symptoms,
      otherSymptom: s.symptoms.includes('other') ? trimOrUndefined(s.otherSymptom) : undefined,
      notes: trimOrUndefined(s.notes),
    };
    const issues = validatePeriod(item, data.periods, today, existing?.id);
    if (!s.start) issues.unshift({ field: 'start', message: 'יש לבחור תאריך התחלה' });
    if (issues.length) {
      setErrors(Object.fromEntries(issues.map((i) => [i.field, i.message])));
      return;
    }
    save('periods', item, existing ? 'המחזור עודכן' : 'המחזור נשמר');
    clear();
    onDone();
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-5"
    >
      {hasDraft ? (
        <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-ink-soft">
          שוחזרה טיוטה שלא נשמרה.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="תחילת הדימום" error={errors.start}>
          {(p) => (
            <DateInput
              {...p}
              required
              max={today}
              value={s.start}
              onChange={(e) => update({ start: e.target.value })}
            />
          )}
        </Field>
        <Field label="שעת התחלה" optional hint="משמשת בעתיד גם לתיעוד ההלכתי">
          {(p) => (
            <TimeInput
              {...p}
              value={s.startTime}
              onChange={(e) => update({ startTime: e.target.value })}
            />
          )}
        </Field>
        <Field label="סיום הדימום" optional error={errors.end}>
          {(p) => (
            <DateInput
              {...p}
              min={s.start}
              max={today}
              value={s.end}
              onChange={(e) => update({ end: e.target.value })}
            />
          )}
        </Field>
        <Field
          label="מספר ימי דימום"
          optional
          error={errors.bleedDays}
          hint={autoBleed ? 'חושב לפי תאריך הסיום' : 'אם עדיין אין תאריך סיום'}
        >
          {(p) => (
            <TextInput
              {...p}
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              dir="ltr"
              className="text-end"
              disabled={!!autoBleed}
              value={autoBleed ? String(autoBleed) : s.bleedDays}
              onChange={(e) => update({ bleedDays: e.target.value })}
            />
          )}
        </Field>
      </div>
      <Segmented
        label="עוצמת הדימום"
        value={s.flow}
        options={FLOW_OPTIONS}
        onChange={(v) => update({ flow: v })}
        allowEmpty
      />
      <ChipGroup
        label="תסמינים"
        values={s.symptoms}
        options={SYMPTOM_OPTIONS}
        onChange={(v) => update({ symptoms: v })}
      />
      {s.symptoms.includes('other') ? (
        <Field label="תסמין אחר">
          {(p) => (
            <TextInput
              {...p}
              maxLength={120}
              value={s.otherSymptom}
              onChange={(e) => update({ otherSymptom: e.target.value })}
            />
          )}
        </Field>
      ) : null}
      <Field label="הערות אישיות" optional>
        {(p) => (
          <TextArea
            {...p}
            maxLength={1000}
            value={s.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
        )}
      </Field>
      <FormActions>
        {existing ? (
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            מחיקה
          </Button>
        ) : null}
        <Button type="submit" className="sm:min-w-40">
          {existing ? 'שמירת שינויים' : 'שמירת מחזור'}
        </Button>
      </FormActions>
      {existing ? (
        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          title="מחיקת מחזור"
          message="המחזור, כולל התסמינים וההערות שלו, יימחק. אפשר לבטל את המחיקה מההודעה שתופיע."
          confirmLabel="מחיקה"
          danger
          onConfirm={() => {
            remove('periods', existing.id, 'המחזור נמחק');
            onDone();
          }}
        />
      ) : null}
    </form>
  );
}
