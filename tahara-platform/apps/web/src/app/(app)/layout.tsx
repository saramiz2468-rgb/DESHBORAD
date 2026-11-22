import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@tahara/ui';
import { BottomNav, SideNav } from '@/components/AppNav';
import { PreviewBanner } from '@/components/PreviewBanner';

/**
 * Personal-area shell. Stage 1: structure only. No session, no data, nothing is stored.
 * From stage 2 this layout will call requireUser()/requireEntitlement() on the server –
 * in addition to (never instead of) RLS in the database.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex max-w-6xl">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-line px-4 py-6 lg:flex">
          <Link href="/" className="mb-8 px-2" aria-label="TAHARA – דף הבית">
            <Logo />
          </Link>
          <SideNav />
          <p className="mt-auto px-2 text-xs leading-relaxed text-ink-faint">
            כלי עזר למעקב אישי. לא ייעוץ רפואי ולא פסק הלכה.
          </p>
        </aside>
        <div className="min-w-0 flex-1">
          <PreviewBanner text="תצוגת מבנה בלבד. אין כאן נתונים אמיתיים, ושום דבר לא נשמר." />
          <header className="flex h-14 items-center justify-between border-b border-line px-4 lg:hidden">
            <Link href="/" aria-label="TAHARA – דף הבית">
              <Logo subtitle={false} />
            </Link>
          </header>
          <main id="main" className="px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
