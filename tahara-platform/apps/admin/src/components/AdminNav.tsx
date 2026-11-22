'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@tahara/ui';
import { ADMIN_MODULES } from '@/config/modules';

export function AdminNav({ orientation }: { orientation: 'vertical' | 'horizontal' }) {
  const pathname = usePathname();
  return (
    <nav aria-label="ניווט במערכת הניהול">
      <ul
        className={cn(
          orientation === 'vertical'
            ? 'space-y-1'
            : 'flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]',
        )}
      >
        {ADMIN_MODULES.map((m) => {
          const active = pathname === m.href;
          return (
            <li key={m.key} className="shrink-0">
              <Link
                href={m.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 items-center rounded-xl px-3 text-sm whitespace-nowrap transition-colors',
                  active
                    ? 'bg-blush font-medium text-rose-strong'
                    : 'text-ink-soft hover:bg-surface-muted hover:text-ink',
                )}
              >
                {m.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
