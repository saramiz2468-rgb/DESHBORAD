import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, Card, Logo, Notice, StatusBadge } from '@tahara/ui';
import { PreviewBanner } from '@/components/PreviewBanner';

export const metadata: Metadata = { title: 'כניסה' };

/**
 * Stage 1: visual skeleton only. The form is disabled and has no action –
 * Magic Link authentication (Supabase) is implemented in stage 2.
 */
export default function LoginPage() {
  return (
    <>
      <PreviewBanner text="הכניסה עדיין לא פעילה. היא תופעל בשלב 2." />
      <main
        id="main"
        className="mx-auto flex min-h-[calc(100dvh-2.25rem)] max-w-md flex-col justify-center px-4 py-10"
      >
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="TAHARA – דף הבית">
            <Logo />
          </Link>
        </div>
        <Card className="p-6 sm:p-8">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h1 className="font-display font-black tracking-tight text-2xl text-plum">
              כניסה לחשבון
            </h1>
            <StatusBadge status="locked" />
          </div>
          <p className="mb-6 text-sm leading-relaxed text-ink-soft">
            תקבלי למייל קישור כניסה אישי לשימוש חד־פעמי, בלי סיסמה.
          </p>
          <form aria-label="טופס כניסה (לא פעיל)">
            <fieldset disabled className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">כתובת מייל</span>
                <input
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="block min-h-12 w-full rounded-2xl border border-line bg-surface-muted px-4 text-start text-ink placeholder:text-ink-faint disabled:cursor-not-allowed"
                />
              </label>
              <Button type="submit" className="w-full">
                שליחת קישור כניסה
              </Button>
            </fieldset>
          </form>
          <Notice className="mt-6">
            הגישה תינתן רק למי שרכשה את TAHARA. הרכישה עדיין לא פתוחה.
          </Notice>
        </Card>
      </main>
    </>
  );
}
