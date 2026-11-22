'use client';

import { useState } from 'react';
import { Button } from '@tahara/ui';
import type { ISODate } from '@tahara/core/calendar';
import { MUCUS_LABELS } from '@/domain/labels';
import type { FertilityLog, MucusKey, SymptomKey } from '@/domain/types';
import { newId, useTahara } from '@/state/store';
import {
  ChipGroup,
  DateInput,
  Field,
  FormActions,
  Segmented,
  Switch,
  TextArea,
  TextInput,
} from '@/components/app/fields';
import { SYMPTOM_OPTIONS } from './PeriodForm';
import { optionalNumber, trimOrUndefined, useFormState } from './useFormState';

const MUCUS_OPTIONS = (Object.keys(MUCUS_LABELS) as MucusKey[]).map((v) => ({
  value: v,
  label: MUCUS_LABELS[v],
}));

export function FertilityForm({
  existing,
  date,
  focus,
  onDone,
}: {
  existing?: FertilityLog | undefined;
  date?: ISODate | undefined;
  focus?: 'lh';
  onDone: () => void;
}) {
  const { today, save, remove } = useTahara();
  const [errors, setErrors] = useState<{ date?: string; bbt?: string; form?: string }>({});
  const {
    state: s,
    update,
    clear,
  } = useFormState(existing ? null : 'new-fertility', () => ({
    date: existing?.date ?? date ?? today,
    lh: existing?.lh as FertilityLog['lh'],
    mucus: existing?.mucus as MucusKey | undefined,
    ovulationPain: existing?.ovulationPain ?? false,
    bbt: existing?.bbt ? String(existing.bbt) : '',
    symptoms: existing?.symptoms ?? ([] as SymptomKey[]),
    notes: existing?.notes ?? '',
  }));

  function submit() {
    const bbt = optionalNumber(s.bbt);
    const e: typeof errors = {};
    if (s.date > today) e.date = 'אי אפשר לתעד תאריך עתידי';
    if (s.bbt && (bbt === undefined || bbt < 34 || bbt > 40)) e.bbt = 'חום גוף בין 34 ל-40 מעלות';
    if (!s.lh && !s.mucus && !s.ovulationPain && !s.bbt && !s.symptoms.length && !s.notes.trim())
      e.form = 'יש למלא לפחות שדה אחד';
    setErrors(e);
    if (Object.keys(e).length) return;
    save(
      'fertilityLogs',
      {
        id: existing?.id ?? newId(),
        date: s.date,
        lh: s.lh,
        mucus: s.mucus,
        ovulationPain: s.ovulationPain || undefined,
        bbt,
        symptoms: s.symptoms,
        notes: trimOrUndefined(s.notes),
      },
      'התיעוד נשמר',
    );
    clear();
    onDone();
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Field label="תאריך" error={errors.date}>
        {(p) => (
          <DateInput
            {...p}
            max={today}
            value={s.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        )}
      </Field>
      <Segmented
        label={focus === 'lh' ? 'תוצאת בדיקת ביוץ (LH)' : 'בדיקת ביוץ (LH)'}
        value={s.lh}
        allowEmpty
        options={[
          { value: 'negative', label: 'שלילית' },
          { value: 'positive', label: 'חיובית' },
        ]}
        onChange={(v) => update({ lh: v })}
      />
      <Segmented
        label="הפרשות"
        value={s.mucus}
        options={MUCUS_OPTIONS}
        allowEmpty
        onChange={(v) => update({ mucus: v })}
      />
      <Switch
        label="כאבי ביוץ"
        checked={s.ovulationPain}
        onChange={(v) => update({ ovulationPain: v })}
      />
      <Field label="חום גוף בסיסי (°C)" optional error={errors.bbt} hint="מדידה בבוקר, לפני קימה">
        {(p) => (
          <TextInput
            {...p}
            type="number"
            inputMode="decimal"
            step="0.01"
            min={34}
            max={40}
            dir="ltr"
            className="text-end"
            value={s.bbt}
            onChange={(e) => update({ bbt: e.target.value })}
          />
        )}
      </Field>
      <ChipGroup
        label="תסמינים"
        values={s.symptoms}
        options={SYMPTOM_OPTIONS}
        onChange={(v) => update({ symptoms: v })}
      />
      <Field label="הערות" optional error={errors.form}>
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
              remove('fertilityLogs', existing.id, 'התיעוד נמחק');
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
