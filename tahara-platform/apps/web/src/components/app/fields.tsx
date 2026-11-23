'use client';

import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@tahara/ui';
import { formatDate, isISODate } from '@tahara/core/calendar';

const control =
  'block min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors focus:border-rose-soft focus:outline-none aria-[invalid=true]:border-rose-strong';

export function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  optional?: boolean;
  children: (props: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
  }) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy =
    [hint ? hintId : '', error ? errId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline gap-2 text-sm font-medium text-ink">
        {label}
        {optional ? <span className="text-xs font-normal text-ink-faint">(לא חובה)</span> : null}
      </label>
      {children({
        id,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(error ? { 'aria-invalid': true } : {}),
      })}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} role="alert" className="text-xs font-medium text-rose-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, props.className)} />;
}

/** Native date picker; value is always 'YYYY-MM-DD'. Digits read LTR. */
export function DateInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const v = typeof props.value === 'string' ? props.value : '';
  return (
    <div>
      <input
        type="date"
        dir="ltr"
        {...props}
        className={cn(control, 'text-end', props.className)}
      />
      {/* The native picker's format follows the device locale; always show the date unambiguously. */}
      {isISODate(v) ? (
        <p aria-hidden className="mt-1 text-xs text-ink-soft">
          {formatDate(v, 'both', { weekday: true })}
        </p>
      ) : null}
    </div>
  );
}

export function TimeInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <input type="time" dir="ltr" {...props} className={cn(control, 'text-end', props.className)} />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      {...props}
      className={cn(control, 'min-h-24 py-3 leading-relaxed', props.className)}
    />
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  allowEmpty,
}: {
  label: string;
  value: T | undefined;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (v: T | undefined) => void;
  allowEmpty?: boolean;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(on && allowEmpty ? undefined : o.value)}
              className={cn(
                'min-h-11 rounded-pill border px-4 text-sm transition-colors',
                on
                  ? 'border-ink bg-ink font-bold text-surface'
                  : 'border-line bg-surface text-ink-soft hover:border-rose-soft',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ChipGroup<T extends string>({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: readonly T[];
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (v: T[]) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = values.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() =>
                onChange(on ? values.filter((x) => x !== o.value) : [...values, o.value])
              }
              className={cn(
                'inline-flex min-h-10 items-center gap-1.5 rounded-pill border px-3.5 text-sm transition-colors',
                on
                  ? 'border-rose-soft bg-blush text-rose-strong'
                  : 'border-line bg-surface text-ink-soft hover:border-rose-soft',
              )}
            >
              {on ? (
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  aria-hidden
                >
                  <path d="m5 12 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string | undefined;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p id={id} className="text-[0.95rem] text-ink">
          {label}
        </p>
        {description ? <p className="mt-0.5 text-xs text-ink-faint">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-rose' : 'bg-line',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-1 size-5 rounded-full bg-surface shadow-soft transition-[inset-inline-start]',
            checked ? 'start-6' : 'start-1',
          )}
        />
      </button>
    </div>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">{children}</div>;
}
