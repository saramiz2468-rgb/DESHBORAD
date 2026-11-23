import type { ReactNode } from 'react';
import { Card, cn } from '@tahara/ui';

/** Visible marker for every medical estimate. */
export function EstimateTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border border-dashed border-rose-soft px-2 py-0.5 text-[0.7rem] font-medium text-rose',
        className,
      )}
    >
      הערכה
    </span>
  );
}

export function DemoTag() {
  return (
    <span className="inline-flex items-center rounded-pill bg-gold-soft px-2 py-0.5 text-[0.7rem] font-medium text-ink-soft">
      נתוני הדגמה
    </span>
  );
}

export function ProgressRing({
  value,
  max,
  size = 132,
  children,
  label,
}: {
  value: number;
  max: number;
  size?: number;
  children?: ReactNode;
  label: string;
}) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--tk-blush)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--tk-rose)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('flex flex-col items-center px-6 py-9 text-center', className)}>
      {icon ? (
        <div className="mb-4 grid size-14 place-items-center rounded-full bg-blush text-rose">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display font-black tracking-tight text-lg text-plum">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-soft">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}

export function Stat({
  label,
  value,
  unit,
  estimate,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  estimate?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs text-ink-soft">
        {label}
        {estimate ? <EstimateTag /> : null}
      </p>
      <p className="mt-1 font-display font-black tracking-tight text-2xl leading-tight text-ink">
        {value ?? '—'}
        {unit && value !== null && value !== undefined ? (
          <span className="ms-1 font-sans text-sm text-ink-soft">{unit}</span>
        ) : null}
      </p>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[0.95rem] font-semibold text-ink">{children}</h2>
      {action}
    </div>
  );
}
