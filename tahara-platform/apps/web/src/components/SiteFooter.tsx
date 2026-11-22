import Link from 'next/link';
import { LogoMark } from '@tahara/ui';

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-ink-soft sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex max-w-sm items-start gap-3">
          <LogoMark className="size-7 shrink-0" />
          <p className="leading-relaxed">
            TAHARA היא כלי עזר למעקב אישי. היא אינה ייעוץ רפואי ואינה פסק הלכה.
          </p>
        </div>
        <nav aria-label="מסמכים" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/legal/terms" className="hover:text-ink">
            תנאי שימוש
          </Link>
          <Link href="/legal/privacy" className="hover:text-ink">
            מדיניות פרטיות
          </Link>
          <Link href="/legal/accessibility" className="hover:text-ink">
            הצהרת נגישות
          </Link>
        </nav>
      </div>
    </footer>
  );
}
