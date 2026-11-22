'use client';

import { useState } from 'react';
import { Button, Card, Notice, PageHeader, StatusBadge } from '@tahara/ui';
import { Icon, type IconName } from '@/components/Icon';
import { SectionTitle } from '@/components/app/bits';
import { ConfirmDialog } from '@/components/app/ConfirmDialog';
import { Switch } from '@/components/app/fields';
import { useTahara } from '@/state/store';

export function PrivacyScreen() {
  const { data, today, isDemo, resetAll, notify } = useTahara();
  const [confirm, setConfirm] = useState(false);

  function exportJson() {
    const payload = {
      app: 'TAHARA',
      schema: 1,
      exportedAt: new Date().toISOString(),
      demo: isDemo,
      data,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `tahara-export-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('קובץ הייצוא נוצר');
  }

  return (
    <div className="space-y-6">
      <PageHeader title="פרטיות ואבטחה" description="שליטה מלאה בנתונים שלך." />

      <Card className="space-y-2 bg-gradient-to-bl from-blush/60 to-surface">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <Icon name="lock" className="size-5 text-rose" />
          כך נשמרת הפרטיות שלך
        </p>
        <ul className="space-y-1.5 text-sm leading-relaxed text-ink-soft">
          <li>• רק את רואה את הנתונים שלך. גם צוות השירות לא יכול לגשת לתוכן האישי.</li>
          <li>• המעקב הרפואי והמעקב ההלכתי נשמרים בנפרד.</li>
          <li>• אין שמירה של מידע אישי במטמון של המכשיר, ואין כלי מעקב או פרסום.</li>
          <li>• האפליקציה לא משתמשת במיקום GPS.</li>
        </ul>
      </Card>

      <section>
        <SectionTitle>נעילת אפליקציה</SectionTitle>
        <Card>
          <Switch
            label="נעילה בכניסה לאפליקציה"
            description="תתווסף יחד עם החשבון האישי"
            checked={false}
            disabled
            onChange={() => undefined}
          />
        </Card>
      </section>

      <section>
        <SectionTitle>ייצוא מידע</SectionTitle>
        <Card className="space-y-3">
          <ExportRow
            icon="download"
            title="קובץ JSON מלא"
            text={isDemo ? 'כולל את נתוני ההדגמה שבלשונית' : 'כל הנתונים שבלשונית הזו'}
            action={
              <Button variant="secondary" onClick={exportJson}>
                הורדה
              </Button>
            }
          />
          <ExportRow
            icon="book"
            title="דוח PDF מסודר"
            text="היסטוריית מחזורים, טהרה וסטטיסטיקות"
            action={<StatusBadge status="planned" />}
          />
          <p className="text-xs text-ink-faint">
            הייצוא יהיה זמין תמיד, גם אם הזכאות לרכישה בוטלה, בהתאם למדיניות השירות.
          </p>
        </Card>
      </section>

      <section>
        <SectionTitle>ייבוא מהגרסה הקודמת</SectionTitle>
        <Card>
          <ExportRow
            icon="upload"
            title="קובץ גיבוי של TAHARA"
            text="קריאה ופענוח במכשיר, בדיקת תקינות ודוח לפני שמירה"
            action={<StatusBadge status="planned" />}
          />
        </Card>
      </section>

      <section>
        <SectionTitle>הרשאות והתראות</SectionTitle>
        <Card className="space-y-2 text-sm text-ink-soft">
          <p>התראות: לפי מה שתבחרי בתזכורות. התוכן במסך הנעילה ניטרלי כברירת מחדל.</p>
          <p>מיקום: לא נדרש. העיר לחישובי זריחה ושקיעה תיבחר מרשימה.</p>
        </Card>
      </section>

      <section>
        <SectionTitle>מחיקה</SectionTitle>
        <Card className="space-y-3">
          <Notice>
            במצב ההדגמה, המחיקה מנקה את הנתונים שבלשונית. מחיקת חשבון מלאה, כולל כל הנתונים בשרת,
            תתווסף יחד עם החשבון האישי.
          </Notice>
          <Button
            variant="secondary"
            className="border-rose-soft text-rose-strong"
            onClick={() => setConfirm(true)}
          >
            <Icon name="trash" className="size-4" />
            מחיקת כל הנתונים
          </Button>
        </Card>
      </section>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="מחיקת כל הנתונים"
        message="כל המחזורים, התיעוד ההלכתי, התיעוד הרפואי וההגדרות יימחקו מהלשונית. לא ניתן לבטל את הפעולה."
        confirmLabel="מחיקה"
        danger
        onConfirm={() => {
          resetAll();
          notify('כל הנתונים נמחקו', 'info');
        }}
      />
    </div>
  );
}

function ExportRow({
  icon,
  title,
  text,
  action,
}: {
  icon: IconName;
  title: string;
  text: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush text-rose">
        <Icon name={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.95rem] text-ink">{title}</p>
        <p className="text-xs text-ink-faint">{text}</p>
      </div>
      {action}
    </div>
  );
}
