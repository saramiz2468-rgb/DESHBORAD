'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, Notice, PageHeader } from '@tahara/ui';
import type { DateDisplay } from '@tahara/core/calendar';
import { Icon } from '@/components/Icon';
import { SectionTitle } from '@/components/app/bits';
import { Field, Segmented, Switch, TextInput } from '@/components/app/fields';
import { useSheets } from '@/features/forms/ActionSheets';
import { useTahara } from '@/state/store';

export function SettingsScreen() {
  const { data, setPreferences, notify } = useTahara();
  const { open } = useSheets();
  const prefs = data.preferences;
  const [cycle, setCycle] = useState(
    prefs.declaredCycleLength ? String(prefs.declaredCycleLength) : '',
  );
  const [bleed, setBleed] = useState(
    prefs.declaredBleedDays ? String(prefs.declaredBleedDays) : '',
  );
  const [errors, setErrors] = useState<{ cycle?: string; bleed?: string }>({});

  function saveCycle() {
    const c = cycle ? Number(cycle) : undefined;
    const b = bleed ? Number(bleed) : undefined;
    const e: typeof errors = {};
    if (c !== undefined && (!Number.isInteger(c) || c < 15 || c > 60))
      e.cycle = 'אורך מחזור בין 15 ל-60 ימים';
    if (b !== undefined && (!Number.isInteger(b) || b < 1 || b > 15)) e.bleed = 'בין 1 ל-15 ימים';
    setErrors(e);
    if (Object.keys(e).length) return;
    setPreferences({ declaredCycleLength: c, declaredBleedDays: b });
    notify('הגדרות המחזור נשמרו');
  }

  return (
    <div className="space-y-6">
      <PageHeader title="הגדרות" description="התאמה אישית של המעקב והתצוגה." />

      <section>
        <SectionTitle>הגדרות מחזור</SectionTitle>
        <Card className="space-y-5">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveCycle();
            }}
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="אורך מחזור רגיל"
                optional
                error={errors.cycle}
                hint="משמש להערכות עד שיצטברו שני מחזורים"
              >
                {(p) => (
                  <TextInput
                    {...p}
                    type="number"
                    inputMode="numeric"
                    min={15}
                    max={60}
                    dir="ltr"
                    className="text-end"
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value)}
                  />
                )}
              </Field>
              <Field label="מספר ימי דימום רגיל" optional error={errors.bleed}>
                {(p) => (
                  <TextInput
                    {...p}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={15}
                    dir="ltr"
                    className="text-end"
                    value={bleed}
                    onChange={(e) => setBleed(e.target.value)}
                  />
                )}
              </Field>
            </div>
            <Button type="submit" variant="secondary">
              שמירה
            </Button>
          </form>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="text-[0.95rem] text-ink">תאריך המחזור האחרון</p>
              <p className="text-xs text-ink-faint">נשמר כרשומת מחזור רגילה</p>
            </div>
            <Button variant="ghost" onClick={() => open({ kind: 'period' })}>
              תיעוד
            </Button>
          </div>
          <div className="border-t border-line pt-4">
            <Segmented
              label="שיטת חישוב ההערכות"
              value={prefs.method}
              options={[
                { value: 'average', label: 'ממוצע 6 המחזורים האחרונים' },
                { value: 'recent3', label: '3 המחזורים האחרונים' },
              ]}
              onChange={(v) => v && setPreferences({ method: v })}
            />
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>הגדרות הלכתיות</SectionTitle>
        <Card className="space-y-4">
          <Notice tone="caution">
            אפשרויות המנהג יוצגו כאן רק אחרי שיאושרו על ידי גורם הלכתי מוסמך. לא נוספו הגדרות שלא
            נבדקו.
          </Notice>
          <Field label="מנהג">
            {(p) => (
              <select
                {...p}
                disabled
                className="block min-h-12 w-full rounded-2xl border border-line bg-surface-muted px-4 text-ink-faint"
              >
                <option>אין עדיין מנהגים מאושרים</option>
              </select>
            )}
          </Field>
          <Switch
            label="עונה בינונית"
            description="ממתין לאישור"
            checked={false}
            disabled
            onChange={() => undefined}
          />
          <Switch
            label="אור זרוע"
            description="ממתין לאישור"
            checked={false}
            disabled
            onChange={() => undefined}
          />
          <p className="text-xs text-ink-faint">
            התאמות אישיות לפי הנחיית רב או יועצת יתאפשרו יחד עם המנוע ההלכתי.
          </p>
        </Card>
      </section>

      <section>
        <SectionTitle>תצוגה</SectionTitle>
        <Card className="space-y-5">
          <Segmented<DateDisplay>
            label="תאריכים"
            value={prefs.dateDisplay}
            options={[
              { value: 'hebrew', label: 'עברי' },
              { value: 'gregorian', label: 'לועזי' },
              { value: 'both', label: 'משולב' },
            ]}
            onChange={(v) => v && setPreferences({ dateDisplay: v })}
          />
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="text-[0.95rem] text-ink">צבעי אירועים בלוח</p>
              <p className="text-xs text-ink-faint">
                לא זמין עדיין. הצבעים הנוכחיים נבחרו כך שיהיו קריאים גם לעיוורון צבעים.
              </p>
            </div>
            <Button variant="ghost" disabled>
              בקרוב
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-[0.95rem] text-ink">העדפות התראות</p>
            <Link
              href="/reminders"
              className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-rose"
            >
              לתזכורות <Icon name="chevron" className="size-4" />
            </Link>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="text-[0.95rem] text-ink">עיר לחישוב זריחה ושקיעה</p>
              <p className="text-xs text-ink-faint">
                בחירה מרשימת ערים, בלי מיקום GPS. תתווסף יחד עם המנוע ההלכתי.
              </p>
            </div>
            <Button variant="ghost" disabled>
              בקרוב
            </Button>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle>פרטיות</SectionTitle>
        <Card>
          <Link
            href="/privacy"
            className="flex min-h-12 items-center justify-between gap-3 text-[0.95rem] text-ink"
          >
            <span className="flex items-center gap-3">
              <Icon name="shield" className="size-5 text-rose" />
              נעילה, ייצוא ומחיקת נתונים
            </span>
            <Icon name="chevron" className="size-4 text-ink-faint" />
          </Link>
        </Card>
      </section>
    </div>
  );
}
