import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@tahara/ui';
import { BottomNav, SideNav } from '@/components/AppNav';
import { SimulationBar } from '@/components/SimulationBar';
import { Ticker } from '@/components/Ticker';
import { HalachaWatcher } from '@/components/app/HalachaWatcher';
import { Toaster } from '@/components/app/Toaster';
import { ActionSheetsProvider } from '@/features/forms/ActionSheets';
import { TaharaStoreProvider } from '@/state/store';

/**
 * Personal-area shell (stage A: interactive design simulation, in-memory data).
 * From stage B this layout calls requireUser()/requireEntitlement() on the server,
 * in addition to (never instead of) RLS in the database.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <TaharaStoreProvider>
      <ActionSheetsProvider>
        <div className="min-h-dvh">
          <div className="mx-auto flex max-w-6xl">
            <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-e border-line px-4 py-6 lg:flex">
              <Link href="/" className="mb-7 px-2" aria-label="TAHARA – דף הבית">
                <Logo />
              </Link>
              <SideNav />
              <p className="mt-auto px-2 pt-6 text-xs leading-relaxed text-ink-faint">
                כלי עזר למעקב אישי. לא ייעוץ רפואי ולא פסק הלכה.
              </p>
            </aside>
            <div className="min-w-0 flex-1">
              <SimulationBar />
              <Ticker />
              <header className="flex h-14 items-center justify-between border-b border-line px-4 lg:hidden">
                <Link href="/today" aria-label="TAHARA – בית">
                  <Logo subtitle={false} />
                </Link>
              </header>
              <main id="main" className="px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
                <div className="mx-auto max-w-3xl animate-[fade-up_240ms_ease-out]">{children}</div>
              </main>
            </div>
          </div>
          <BottomNav />
          <Toaster />
          <HalachaWatcher />
        </div>
      </ActionSheetsProvider>
    </TaharaStoreProvider>
  );
}
