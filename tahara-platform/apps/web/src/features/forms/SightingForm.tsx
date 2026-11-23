'use client';

import { useState } from 'react';
import { Button, Notice } from '@tahara/ui';
import { cityById, formatDate, formatMinutes, sunTimes, type ISODate } from '@tahara/core/calendar';
import {
  COMPLEX_CASE_MESSAGE,
  ONAH_LABEL,
  resolveSighting,
  type ComplexFlag,
  type OnahMode,
  type SightingKind,
} from '@tahara/core/halacha-engine';
import { COMPLEX_FLAG_LABELS, ONAH_MODE_LABELS, SIGHTING_KIND_LABELS } from '@/domain/labels';
import type { Sighting } from '@/domain/types';
import { newId, useTahara } from '@/state/store';
import {
  ChipGroup,
  DateInput,
  Field,
  FormActions,
  Segmented,
  TextArea,
  TimeInput,
} from '@/components/app/fields';
import { ConfirmDialog } from '@/components/app/ConfirmDialog';
import { trimOrUndefined, useFormState } from './useFormState';

const MODES = (Object.keys(ONAH_MODE_LABELS) as OnahMode[]).map((v) => ({
  value: v,
  label: ONAH_MODE_LABELS[v],
}));
const KINDS = (Object.keys(SIGHTING_KIND_LABELS) as SightingKind[]).map((v) => ({
  value: v,
  label: SIGHTING_KIND_LABELS[v],
}));
const FLAGS = (Object.keys(COMPLEX_FLAG_LABELS) as ComplexFlag[]).map((v) => ({
  value: v,
  label: COMPLEX_FLAG_LABELS[v],
}));

/** Halachic sighting (ראייה). Records facts only; the engine computes, and every result is a draft until approved. */
export function SightingForm({
  existing,
  date,
  onDone,
}: {
  existing?: Sighting | undefined;
  date?: ISODate | undefined;
  onDone: () => void;
}) {
  const { data, today, save, remove } = useTahara();
  const [error, setError] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const city = cityById(data.halacha.cityId);
  const {
    state: s,
    update,
    clear,
  } = useFormState(existing ? null : 'new-sighting', () => ({
    date: existing?.date ?? date ?? today,
    time: existing?.time ?? '',
    onahMode: existing?.onahMode ?? ('auto' as OnahMode),
    kind: existing?.kind ?? ('regular' as SightingKind),
    flags: existing?.flags ?? ([] as ComplexFlag[]),
    notes: existing?.notes ?? '',
  }));

  const sun = s.date ? sunTimes(s.date, city.lat, city.lng) : null;
  const preview = s.date
    ? resolveSighting(
        {
          id: 'p',
          date: s.date,
          time: s.time || undefined,
          onahMode: s.onahMode,
          kind: s.kind,
          flags: s.flags,
        },
        city,
      )
    : null;
  const complex = s.kind !== 'regular' || s.flags.length > 0;

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!s.date || s.date > today) return setError('יש לבחור תאריך שאינו עתידי');
        if (s.onahMode === 'auto' && !s.time)
          return setError('במצב אוטומטי יש להזין שעה, או לבחור עונה ידנית');
        save(
          'sightings',
          {
            id: existing?.id ?? newId(),
            date: s.date,
            time: trimOrUndefined(s.time),
            onahMode: s.onahMode,
            kind: s.kind,
            flags: s.flags,
            periodId: existing?.periodId,
            notes: trimOrUndefined(s.notes),
          },
          existing ? 'הראייה עודכנה. המועדים חושבו מחדש' : 'הראייה נשמרה. המועדים חושבו מחדש',
        );
        clear();
        onDone();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="תאריך תחילת הראייה" error={error}>
          {(p) => (
            <DateInput
              {...p}
              max={today}
              value={s.date}
              onChange={(e) => update({ date: e.target.value })}
            />
          )}
        </Field>
        <Field
          label="שעה"
          optional={s.onahMode !== 'auto'}
          hint={
            sun
              ? `${city.name}: זריחה ${formatMinutes(sun.sunrise)} · שקיעה ${formatMinutes(sun.sunset)}`
              : undefined
          }
        >
          {(p) => (
            <TimeInput {...p} value={s.time} onChange={(e) => update({ time: e.target.value })} />
          )}
        </Field>
      </div>
      <Field label="עונה">
        {(p) => (
          <select
            {...p}
            value={s.onahMode}
            onChange={(e) => update({ onahMode: e.target.value as OnahMode })}
            className="block min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[0.95rem] text-ink"
          >
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      {preview && preview.onah ? (
        <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-ink-soft">
          לפי הנתונים: <strong className="text-ink">{ONAH_LABEL[preview.onah]}</strong> של{' '}
          {formatDate(preview.hdate, 'both', { year: false })}
          {preview.nearTwilight ? ' · סמוך לזריחה או לשקיעה, יש לברר עם רב' : ''}
        </p>
      ) : null}
      <Segmented
        label="סוג"
        value={s.kind}
        options={KINDS}
        onChange={(v) => v && update({ kind: v })}
      />
      <ChipGroup
        label="מצבים מיוחדים"
        values={s.flags}
        options={FLAGS}
        onChange={(v) => update({ flags: v })}
      />
      {complex ? <Notice tone="caution">{COMPLEX_CASE_MESSAGE}</Notice> : null}
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
      <FormActions>
        {existing ? (
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            מחיקה
          </Button>
        ) : null}
        <Button type="submit" className="sm:min-w-40">
          {existing ? 'שמירת שינויים' : 'שמירת ראייה'}
        </Button>
      </FormActions>
      {existing ? (
        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          title="מחיקת ראייה"
          message="הראייה תימחק והמועדים יחושבו מחדש. אפשר לבטל מההודעה שתופיע."
          confirmLabel="מחיקה"
          danger
          onConfirm={() => {
            remove('sightings', existing.id, 'הראייה נמחקה');
            onDone();
          }}
        />
      ) : null}
    </form>
  );
}
