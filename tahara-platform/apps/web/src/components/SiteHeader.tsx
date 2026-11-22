import Link from 'next/link';
import { Logo, buttonClasses } from '@tahara/ui';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="TAHARA – דף הבית">
          <Logo subtitle={false} />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="ניווט ראשי">
          <Link
            href="/#principles"
            className="hidden rounded-pill px-3 py-2 text-sm text-ink-soft hover:text-ink sm:inline"
          >
            העקרונות שלנו
          </Link>
          <Link
            href="/today"
            className="hidden rounded-pill px-3 py-2 text-sm text-ink-soft hover:text-ink sm:inline"
          >
            תצוגת האפליקציה
          </Link>
          <Link href="/login" className={buttonClasses('secondary', 'min-h-10 px-4 text-sm')}>
            כניסה
          </Link>
        </nav>
      </div>
    </header>
  );
}
