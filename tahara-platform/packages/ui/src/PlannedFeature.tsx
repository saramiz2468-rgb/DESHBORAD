import { Card } from './Card';
import { StatusBadge, type FeatureStatus } from './StatusBadge';

export interface PlannedFeatureProps {
  title: string;
  stage: string;
  summary: string;
  items: readonly string[];
  status?: FeatureStatus;
}

/**
 * Describes a capability that is NOT active yet. Never renders inputs or
 * results, so nothing on screen can be mistaken for real functionality.
 */
export function PlannedFeature({
  title,
  stage,
  summary,
  items,
  status = 'planned',
}: PlannedFeatureProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <StatusBadge status={status} />
      </div>
      <p className="text-[0.95rem] leading-relaxed text-ink-soft">{summary}</p>
      {items.length ? (
        <ul className="mt-4 space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rotate-45 bg-rose-soft" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-5 border-t border-line pt-3 text-xs text-ink-faint">{stage}</p>
    </Card>
  );
}
