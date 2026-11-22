import type { Metadata } from 'next';
import { Button, Card, Logo, Notice, StatusBadge } from '@tahara/ui';

export const metadata: Metadata = { title: 'כניסת מנהלת' };

/** Stage 1: disabled skeleton. Admin sign-in = Magic Link + TOTP (MFA, aal2), implemented in stage 2/7. */
export default function AdminLogin() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Logo subtitle={false} />
        <span className="text-xs text-gold">מערכת ניהול</span>
      </div>
      <Card className="p-6 sm:p-8">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h1 className="font-display text-2xl font-medium text-plum">כניסת מנהלת</h1>
          <StatusBadge status="locked" />
        </div>
        <p className="mb-6 text-sm leading-relaxed text-ink-soft">
          כניסה בשני שלבים: קישור חד־פעמי במייל, ואחריו קוד מאפליקציית אימות (TOTP).
        </p>
        <form aria-label="טופס כניסה (לא פעיל)">
          <fieldset disabled className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">מייל מנהלת</span>
              <input
                type="email"
                dir="ltr"
                className="block min-h-12 w-full rounded-2xl border border-line bg-surface-muted px-4 text-start disabled:cursor-not-allowed"
              />
            </label>
            <Button type="submit" className="w-full">
              שליחת קישור
            </Button>
          </fieldset>
        </form>
        <Notice className="mt-6">הכניסה עדיין לא פעילה. היא תופעל יחד עם מערכת ההרשאות.</Notice>
      </Card>
    </main>
  );
}
