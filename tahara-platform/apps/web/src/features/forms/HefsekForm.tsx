'use client';

import { useState } from 'react';
import { Button, Notice } from '@tahara/ui';
import { compareDates, type ISODate } from '@tahara/core/calendar';
import type { Hefsek } from '@/domain/types';
import { newId, useTahara } from '@/state/store';
import {
  DateInput,
  Field,
  FormActions,
  Switch,
  TextArea,
  TimeInput,
} from '@/components/app/fields';
import { ConfirmDialog } from '@/components/app/ConfirmDialog';
import { trimOrUndefined, useFormState } from './useFormState';

export function HefsekForm({
  existing,
  date,
  onDone,
}: {
  existing?: Hefsek | undefined;
  date?: ISODate | undefined;
  onDone: () => void;
}) {
  const { data, today, save, remove } = useTahara();
  const [error, setError] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const lastStart = [...data.periods].sort((a, b) => compareDates(b.start, a.start))[0]?.start;
  const {
    state: s,
    update,
    clear,
  } = useFormState(existing ? null : 'new-hefsek', () => ({
    date: existing?.date ?? date ?? today,
    time: existing?.time ?? '',
    performed: existing?.performed ?? true,
    notes: existing?.notes ?? '',
  }));

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!s.date || s.date > today) return setError('יש לבחור תאריך שאינו עתידי');
        if (lastStart && s.date < lastStart)
          return setError('התאריך קודם לתחילת המחזור האחרון שתועד');
        save(
          'hefseks',
          {
            id: existing?.id ?? newId(),
            date: s.date,
            time: trimOrUndefined(s.time),
            performed: s.performed,
            notes: trimOrUndefined(s.notes),
          },
          'הפסק הטהרה תועד',
        );
        clear();
        onDone();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="תאריך" error={error}>
          {(p) => (
            <DateInput
              {...p}
              max={today}
              min={lastStart}
              value={s.date}
              onChange={(e) => update({ date: e.target.value })}
            />
          )}
        </Field>
        <Field label="שעה" optional>
          {(p) => (
            <TimeInput {...p} value={s.time} onChange={(e) => update({ time: e.target.value })} />
          )}
        </Field>
      </div>
      <Switch
        label="ההפסק בוצע"
        description="אפשר לתעד גם הפסק שתוכנן ולעדכן אחר כך"
        checked={s.performed}
        onChange={(v) => update({ performed: v })}
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
      <Notice>
        זהו תיעוד אישי בלבד. האפליקציה אינה קובעת את תקינות ההפסק. בכל שאלה יש להתייעץ עם רב.
      </Notice>
      <FormActions>
        {existing ? (
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            מחיקה
          </Button>
        ) : null}
        <Button type="submit" className="sm:min-w-40">
          שמירה
        </Button>
      </FormActions>
      {existing ? (
        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          title="מחיקת הפסק טהרה"
          message="יימחקו גם תיעוד הבדיקות והטבילה שקשורים להפסק הזה."
          confirmLabel="מחיקה"
          danger
          onConfirm={() => {
            remove('hefseks', existing.id, 'הפסק הטהרה נמחק');
            onDone();
          }}
        />
      ) : null}
    </form>
  );
}
