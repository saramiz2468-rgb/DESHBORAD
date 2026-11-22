import Link from 'next/link';
import { LogoMark, buttonClasses } from '@tahara/ui';

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <LogoMark className="mx-auto size-12" />
        <h1 className="mt-5 font-display text-3xl font-medium text-plum">העמוד לא נמצא</h1>
        <p className="mt-2 text-ink-soft">ייתכן שהקישור שגוי או שהעמוד הועבר.</p>
        <Link href="/" className={buttonClasses('primary', 'mt-7')}>
          חזרה לדף הבית
        </Link>
      </div>
    </main>
  );
}
