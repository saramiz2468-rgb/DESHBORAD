'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '@tahara/ui';

/**
 * Modal sheet on top of the native <dialog>: focus trap, Esc to close and
 * inert background come from the browser. Bottom sheet on mobile, centered
 * dialog from `sm` up.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'fixed inset-x-0 bottom-0 mx-0 mt-auto mb-0 max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-[1.75rem] bg-surface p-0 text-ink shadow-lift',
        'backdrop:bg-plum/35 backdrop:backdrop-blur-[2px]',
        'sm:inset-0 sm:m-auto sm:rounded-card',
        size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        'open:animate-[sheet-in_220ms_ease-out]',
      )}
    >
      {open ? (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 pt-5 pb-4">
            <div className="min-w-0">
              <span
                aria-hidden
                className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line sm:hidden"
              />
              <h2 id={titleId} className="font-display font-black tracking-tight text-xl text-plum">
                {title}
              </h2>
              {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="סגירה"
              className="grid size-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-muted"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
          {footer ? (
            <div className="border-t border-line bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
