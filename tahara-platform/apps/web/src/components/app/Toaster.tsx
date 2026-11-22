'use client';

import { cn } from '@tahara/ui';
import { useTahara } from '@/state/store';

export function Toaster() {
  const { toasts, dismiss } = useTahara();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-8"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm shadow-lift animate-[toast-in_200ms_ease-out]',
            t.tone === 'error' ? 'bg-rose-strong text-on-rose' : 'bg-plum text-canvas',
          )}
        >
          <span>{t.message}</span>
          {t.undo ? (
            <button
              type="button"
              onClick={() => {
                t.undo?.();
                dismiss(t.id);
              }}
              className="shrink-0 rounded-pill px-3 py-1 font-semibold underline-offset-4 hover:underline"
            >
              ביטול
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
