import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@tahara/ui';
import { AdminNav } from '@/components/AdminNav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-e border-line px-4 py-6 lg:flex">
          <Link href="/dashboard" className="mb-2 px-2">
            <Logo subtitle={false} />
          </Link>
          <p className="mb-6 px-2 text-xs text-gold">מערכת ניהול</p>
          <AdminNav orientation="vertical" />
          <Link href="/login" className="mt-auto px-2 text-xs text-ink-faint hover:text-ink">
            מסך כניסת מנהלת
          </Link>
        </aside>
        <div className="min-w-0 flex-1">
          <div
            role="status"
            className="border-b border-gold-soft bg-gold-soft/35 px-4 py-2 text-center text-[0.8rem] text-ink-soft"
          >
            מערכת הניהול, תצוגת מבנה. לא מחובר שום מקור נתונים, ואין כאן נתונים אמיתיים או לדוגמה.
          </div>
          <header className="border-b border-line px-4 pt-3 lg:hidden">
            <div className="mb-2 flex items-center justify-between">
              <Logo subtitle={false} />
              <span className="text-xs text-gold">מערכת ניהול</span>
            </div>
            <AdminNav orientation="horizontal" />
          </header>
          <main id="main" className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
