'use client';

import { useState } from 'react';
import { Button, Notice } from '@tahara/ui';
import type { Hefsek, Tevila } from '@/domain/types';
import { newId, useTahara } from '@/state/store';
import { DateInput, Field, FormActions, Switch, TextArea } from '@/components/app/fields';
import { trimOrUndefined, useFormState } from './useFormState';

export function TevilaForm({ hefsek, onDone }: { hefsek: Hefsek; onDone: () => void }) {
  const { data, today, save } = useTahara();
  const existing: Tevila | undefined = data.tevilot.find((t) => t.hefsekId === hefsek.id);
  const [error, setError] = useState<string>();
  const { state: s, update } = useFormState(null, () => ({
    planned: existing?.planned ?? '',
    actual: existing?.actual ?? '',
    done: existing?.done ?? false,
    notes: existing?.notes ?? '',
  }));

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (s.planned && s.planned < hefsek.date)
          return setError('התאריך המתוכנן קודם להפסק הטהרה');
        if (s.actual && s.actual > today) return setError('תאריך בפועל לא יכול להיות עתידי');
        if (s.done && !s.actual) return setError('כדי לסמן שהטבילה בוצעה יש לבחור תאריך בפועל');
        save(
          'tevilot',
          {
            id: existing?.id ?? newId(),
            hefsekId: hefsek.id,
            planned: trimOrUndefined(s.planned),
            actual: trimOrUndefined(s.actual),
            done: s.done,
            notes: trimOrUndefined(s.notes),
          },
          'פרטי הטבילה נשמרו',
        );
        onDone();
      }}
    >
      <Notice>
        את מועד הטבילה קובעים לפי הנחיית רב. האפליקציה אינה מחשבת אותו, ורק שומרת את התאריך שתזיני.
      </Notice>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="תאריך מתוכנן" optional>
          {(p) => (
            <DateInput
              {...p}
              min={hefsek.date}
              value={s.planned}
              onChange={(e) => update({ planned: e.target.value })}
            />
          )}
        </Field>
        <Field label="תאריך בפועל" optional error={error}>
          {(p) => (
            <DateInput
              {...p}
              min={hefsek.date}
              max={today}
              value={s.actual}
              onChange={(e) => update({ actual: e.target.value })}
            />
          )}
        </Field>
      </div>
      <Switch
        label="הטבילה בוצעה"
        checked={s.done}
        onChange={(v) => update({ done: v, actual: v && !s.actual ? today : s.actual })}
      />
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
        <Button type="submit" className="sm:min-w-40">
          שמירה
        </Button>
      </FormActions>
    </form>
  );
}
