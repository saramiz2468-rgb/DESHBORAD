'use client';

import { Card, Notice, PageHeader } from '@tahara/ui';
import { REMINDER_LABELS } from '@/domain/labels';
import type { ReminderKey } from '@/domain/types';
import { Switch, TimeInput } from '@/components/app/fields';
import { useTahara } from '@/state/store';

const GROUPS: ReadonlyArray<{ title: string; keys: ReminderKey[] }> = [
  { title: 'מחזור ופוריות', keys: ['period', 'fertile-window', 'ovulation', 'lh-test'] },
  { title: 'טהרה', keys: ['hefsek', 'seven-days', 'tevila'] },
  {
    title: 'ימי פרישה ווסתות',
    keys: ['prishah-before', 'prishah-day', 'recalc', 'pattern', 'missing-data'],
  },
];

export function RemindersScreen() {
  const { data, setReminder, setPreferences } = useTahara();
  const neutral = data.preferences.neutralNotifications;

  return (
    <div>
      <PageHeader title="תזכורות" description="בחרי מה להזכיר לך ובאיזו שעה." />
      <Notice className="mb-5">
        בשלב הזה נשמרות רק ההעדפות. שליחת ההתראות בפועל תופעל בשלב מאוחר יותר, אחרי חיבור החשבון.
      </Notice>

      {GROUPS.map((g) => (
        <section key={g.title} className="mb-5">
          <h2 className="mb-2 text-sm font-semibold text-ink">{g.title}</h2>
          <Card className="p-0 sm:p-0">
            <ul className="divide-y divide-line">
              {g.keys.map((key) => {
                const r = data.reminders[key];
                return (
                  <li key={key} className="px-5 py-4">
                    <Switch
                      label={REMINDER_LABELS[key].title}
                      description={REMINDER_LABELS[key].hint}
                      checked={r.enabled}
                      onChange={(v) => setReminder(key, { enabled: v })}
                    />
                    {r.enabled ? (
                      <div className="mt-3 flex items-center gap-3">
                        <label htmlFor={`t-${key}`} className="text-sm text-ink-soft">
                          שעה
                        </label>
                        <TimeInput
                          id={`t-${key}`}
                          className="max-w-36"
                          value={r.time}
                          onChange={(e) => setReminder(key, { time: e.target.value })}
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      ))}
      <p className="-mt-2 mb-5 text-xs text-ink-faint">
        התראות על ימי פרישה מבוססות על חישובים שעדיין ממתינים לאישור הלכתי, ויסומנו כך גם בהתראה.
      </p>

      <Card>
        <Switch
          label="תוכן ניטרלי במסך הנעילה"
          description="מומלץ. ההתראה לא תחשוף את הנושא."
          checked={neutral}
          onChange={(v) => setPreferences({ neutralNotifications: v })}
        />
        <div className="mt-4 rounded-2xl border border-line bg-surface-muted p-4">
          <p className="mb-2 text-xs text-ink-faint">כך תיראה התראה במסך הנעילה</p>
          <div className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5 shadow-soft">
            <span className="grid size-8 place-items-center rounded-lg bg-blush text-xs font-semibold text-rose">
              T
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">TAHARA</p>
              <p className="truncate text-xs text-ink-soft">
                {neutral ? 'יש לך תזכורת אישית' : 'תזכורת: מחזור צפוי מחר'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
