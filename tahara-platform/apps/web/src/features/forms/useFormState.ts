'use client';

import { useState } from 'react';
import { useTahara } from '@/state/store';

/**
 * Form state that keeps an unsaved draft for NEW records in the in-memory
 * store, so closing a sheet by mistake does not lose input. Drafts never
 * leave the tab's memory.
 */
export function useFormState<T extends object>(draftKey: string | null, initial: () => T) {
  const { drafts, setDraft, clearDraft } = useTahara();
  const [state, setState] = useState<T>(
    () => (draftKey && (drafts[draftKey] as T | undefined)) || initial(),
  );
  const update = (patch: Partial<T>) =>
    setState((s) => {
      const next = { ...s, ...patch };
      if (draftKey) setDraft(draftKey, next);
      return next;
    });
  const hasDraft = !!(draftKey && drafts[draftKey]);
  return { state, update, clear: () => draftKey && clearDraft(draftKey), hasDraft };
}

export const optionalNumber = (v: string): number | undefined => {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const trimOrUndefined = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);
