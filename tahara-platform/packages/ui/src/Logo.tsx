import { cn } from './cn';

/** TAHARA mark: a crescent-and-drop ring in antique rose with a gold accent. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('size-9', className)} aria-hidden focusable="false">
      <circle cx="24" cy="24" r="21" fill="none" stroke="var(--tk-rose)" strokeWidth="2.2" />
      <path
        d="M24 9c5.8 7 9 12 9 16.2A9 9 0 0 1 15 25.2C15 21 18.2 16 24 9Z"
        fill="var(--tk-rose)"
        opacity="0.92"
      />
      <circle cx="36.5" cy="11.5" r="2.4" fill="var(--tk-gold)" />
    </svg>
  );
}

export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className="font-display text-[1.35rem] font-medium tracking-[0.18em] text-plum"
          lang="en"
          dir="ltr"
        >
          TAHARA
        </span>
        {subtitle ? (
          <span className="mt-1 text-[0.7rem] tracking-wide text-ink-faint">
            טהרה · מחזור · פוריות
          </span>
        ) : null}
      </span>
    </span>
  );
}
