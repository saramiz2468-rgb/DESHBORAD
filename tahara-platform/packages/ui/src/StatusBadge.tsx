import { cn } from './cn';

export type FeatureStatus = 'planned' | 'in-development' | 'locked';

const labels: Record<FeatureStatus, string> = {
  planned: 'מתוכנן',
  'in-development': 'בפיתוח',
  locked: 'לא פעיל',
};

/** Visible marker for anything that is not yet a working feature. */
export function StatusBadge({ status, className }: { status: FeatureStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border border-gold-soft bg-gold-soft/40 px-3 py-1 text-xs font-medium text-ink-soft',
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-gold" />
      {labels[status]}
    </span>
  );
}
