'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@tahara/ui';
import { MORE_NAV, PRIMARY_NAV, SIDEBAR_NAV } from '@/config/navigation';
import { Icon } from './Icon';

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === '/more')
      return pathname === '/more' || MORE_NAV.some((m) => pathname.startsWith(m.href));
    return pathname === href || pathname.startsWith(`${href}/`);
  };
}

export function SideNav() {
  const isActive = useIsActive();
  return (
    <nav aria-label="ניווט באפליקציה" className="space-y-0.5">
      {SIDEBAR_NAV.map((item, i) => (
        <div key={item.href}>
          {i === 4 ? (
            <p className="mt-5 mb-2 px-3 text-[0.7rem] tracking-wide text-ink-faint">עוד</p>
          ) : null}
          <Link
            href={item.href}
            aria-current={isActive(item.href) ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors',
              isActive(item.href)
                ? 'bg-blush font-medium text-rose-strong'
                : 'text-ink-soft hover:bg-surface-muted hover:text-ink',
            )}
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="ניווט ראשי"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {PRIMARY_NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
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
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
