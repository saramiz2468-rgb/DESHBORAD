import Link from 'next/link';
import { PageHeader, StatusBadge } from '@tahara/ui';
import { MORE_NAV } from '@/config/navigation';
import { Icon } from '@/components/Icon';

export function MoreScreen() {
  return (
    <div>
      <PageHeader title="עוד" />
      <ul className="overflow-hidden rounded-card border border-line bg-surface shadow-soft">
        {MORE_NAV.map((item, i) => (
          <li key={item.href} className={i ? 'border-t border-line' : ''}>
            <Link
              href={item.href}
              className="flex min-h-16 items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-muted"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush text-rose">
                <Icon name={item.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.95rem] font-medium text-ink">{item.label}</span>
                {item.description ? (
                  <span className="block text-xs text-ink-soft">{item.description}</span>
                ) : null}
              </span>
              {item.availability === 'planned' ? (
                <StatusBadge status="planned" />
              ) : (
                <Icon name="chevron" className="size-4 text-ink-faint" />
              )}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
        TAHARA היא כלי עזר למעקב אישי. היא אינה ייעוץ רפואי ואינה פסק הלכה.
      </p>
    </div>
  );
}
