'use client';

import { useState } from 'react';
import { Button } from '@tahara/ui';
import type { ISODate } from '@tahara/core/calendar';
import type { SymptomKey, SymptomLog } from '@/domain/types';
import { newId, useTahara } from '@/state/store';
import {
  ChipGroup,
  DateInput,
  Field,
  FormActions,
  TextArea,
  TextInput,
} from '@/components/app/fields';
import { SYMPTOM_OPTIONS } from './PeriodForm';
import { trimOrUndefined, useFormState } from './useFormState';

export function SymptomForm({
  existing,
  date,
  onDone,
}: {
  existing?: SymptomLog | undefined;
  date?: ISODate | undefined;
  onDone: () => void;
}) {
  const { today, save, remove } = useTahara();
  const [error, setError] = useState<string>();
  const {
    state: s,
    update,
    clear,
  } = useFormState(existing ? null : 'new-symptom', () => ({
    date: existing?.date ?? date ?? today,
    symptoms: existing?.symptoms ?? ([] as SymptomKey[]),
    otherSymptom: existing?.otherSymptom ?? '',
    notes: existing?.notes ?? '',
  }));

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (s.date > today) return setError('אי אפשר לתעד תאריך עתידי');
        if (!s.symptoms.length && !s.notes.trim())
          return setError('יש לבחור לפחות תסמין אחד או לכתוב הערה');
        save(
          'symptomLogs',
          {
            id: existing?.id ?? newId(),
            date: s.date,
            symptoms: s.symptoms,
            otherSymptom: trimOrUndefined(s.otherSymptom),
            notes: trimOrUndefined(s.notes),
          },
          'התסמינים נשמרו',
        );
        clear();
        onDone();
      }}
    >
      <Field label="תאריך" error={error && s.date > today ? error : undefined}>
        {(p) => (
          <DateInput
            {...p}
            max={today}
            value={s.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        )}
      </Field>
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
      <Field label="הערות" optional error={error && s.date <= today ? error : undefined}>
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
          <Button
            variant="ghost"
            onClick={() => {
              remove('symptomLogs', existing.id, 'התיעוד נמחק');
              onDone();
            }}
          >
            מחיקה
          </Button>
        ) : null}
        <Button type="submit" className="sm:min-w-40">
          שמירה
        </Button>
      </FormActions>
    </form>
  );
}
