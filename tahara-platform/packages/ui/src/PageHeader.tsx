import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-medium tracking-wide text-gold">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-[1.9rem] leading-tight font-medium text-plum sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-prose text-[0.95rem] leading-relaxed text-ink-soft">
            {description}
          </p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  );
}
