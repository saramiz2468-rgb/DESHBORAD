import type { ReactNode } from 'react';
import { cn } from './cn';

type Tone = 'info' | 'caution';

const tones: Record<Tone, string> = {
  info: 'border-line bg-surface-muted text-ink-soft',
  caution: 'border-rose-soft/60 bg-blush/70 text-ink',
};

export function Notice({
  title,
  children,
  tone = 'info',
  className,
}: {
  title?: string;
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      role="note"
      className={cn(
        'rounded-2xl border px-4 py-3.5 text-sm leading-relaxed',
        tones[tone],
        className,
      )}
    >
      {title ? <p className="mb-1 font-semibold text-ink">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
