'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@tahara/ui';
import { APP_FEATURES, PRIMARY_NAV } from '@/config/features';
import { NavIcon } from './NavIcon';

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav() {
  const isActive = useActive();
  return (
    <nav aria-label="ניווט באפליקציה" className="space-y-1">
      {APP_FEATURES.map((f) => (
        <Link
          key={f.key}
          href={f.href}
          aria-current={isActive(f.href) ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors',
            isActive(f.href)
              ? 'bg-blush font-medium text-rose-strong'
              : 'text-ink-soft hover:bg-surface-muted hover:text-ink',
          )}
        >
          <NavIcon name={f.key} className="size-5" />
          {f.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const isActive = useActive();
  return (
    <nav
      aria-label="ניווט ראשי"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {PRIMARY_NAV.map((f) => {
          const active = isActive(f.href);
          return (
            <li key={f.key}>
              <Link
                href={f.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-[0.72rem]',
                  active ? 'font-medium text-rose-strong' : 'text-ink-faint',
                )}
              >
                <span
                  className={cn(
                    'grid h-7 w-12 place-items-center rounded-pill transition-colors',
                    active && 'bg-blush',
                  )}
                >
                  <NavIcon name={f.key} className="size-5" />
                </span>
                {f.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
