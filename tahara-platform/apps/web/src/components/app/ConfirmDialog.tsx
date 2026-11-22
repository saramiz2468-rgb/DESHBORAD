'use client';

import { Button } from '@tahara/ui';
import { Sheet } from './Sheet';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
          <Button variant="secondary" onClick={onClose} className="sm:w-auto">
            ביטול
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={danger ? 'bg-rose-strong hover:bg-plum' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="leading-relaxed text-ink-soft">{message}</p>
    </Sheet>
  );
}
