/**
 * Single source of truth for the screens of the personal app.
 *
 * Stage 1 rule: every entry is `planned`. Nothing here is a working feature,
 * and the UI renders these as descriptions only (no inputs, no results).
 * A unit test fails if any entry is marked otherwise before its stage ships.
 */
export type FeatureKey =
  'today' | 'calendar' | 'log' | 'halacha' | 'insights' | 'import' | 'support' | 'settings';

export interface AppFeature {
  key: FeatureKey;
  href: `/${string}`;
  /** Short label for navigation. */
  label: string;
  title: string;
  description: string;
  status: 'planned';
  stage: string;
  /** Shown in the mobile bottom bar (max 5). */
  primary: boolean;
  sections: ReadonlyArray<{ title: string; summary: string; items: readonly string[] }>;
}

export const APP_FEATURES: readonly AppFeature[] = [
  {
    key: 'today',
    href: '/today',
    label: 'היום',
    title: 'היום שלי',
    description: 'מבט אחד על היום: תאריך עברי ולועזי, מצב המחזור ותזכורות.',
    status: 'planned',
    stage: 'יתווסף בשלבים 3–4, אחרי מנוע התאריכים ומנוע המעקב הרפואי',
    primary: true,
    sections: [
      {
        title: 'סיכום יומי',
        summary: 'כרטיס פתיחה אישי שמתבסס רק על הנתונים שתזיני.',
        items: [
          'תאריך עברי ולועזי לפי שעון ירושלים',
          'יום במחזור והערכה למחזור הבא, מסומנת כהערכה בלבד',
          'תזכורות קרובות שתבחרי להפעיל',
        ],
      },
    ],
  },
  {
    key: 'calendar',
    href: '/calendar',
    label: 'לוח שנה',
    title: 'לוח שנה',
    description: 'לוח חודשי עם תצוגה עברית, לועזית או משולבת.',
    status: 'planned',
    stage: 'יתווסף בשלב 4',
    primary: true,
    sections: [
      {
        title: 'תצוגה דו־לוחית',
        summary: 'בחירה בין לוח עברי, לועזי או שניהם יחד.',
        items: ['סימון ימי מחזור ותיעוד', 'מעבר מהיר בין חודשים', 'לחיצה על יום להצגת פרטיו'],
      },
    ],
  },
  {
    key: 'log',
    href: '/log',
    label: 'תיעוד',
    title: 'תיעוד',
    description: 'רישום מחזור, תסמינים ותצפיות יומיות.',
    status: 'planned',
    stage: 'יתווסף בשלב 4',
    primary: true,
    sections: [
      {
        title: 'מעקב רפואי',
        summary: 'נשמר בנפרד לחלוטין מהמעקב ההלכתי.',
        items: [
          'תחילת מחזור וסיומו',
          'עוצמת דימום ותסמינים',
          'חום גוף בסיסי, בדיקות ביוץ והפרשות',
          'הערות אישיות (נבחנת אפשרות להצפנה נוספת במכשיר)',
        ],
      },
    ],
  },
  {
    key: 'halacha',
    href: '/halacha',
    label: 'טהרה',
    title: 'טהרת המשפחה',
    description: 'מעקב אישי אחר הפסק טהרה, שבעה נקיים, טבילה ועונות.',
    status: 'planned',
    stage: 'יתווסף בשלב 5. יופעל רק אחרי בדיקה ואישור של גורם הלכתי מוסמך',
    primary: true,
    sections: [
      {
        title: 'מעקב הלכתי',
        summary: 'מנוע נפרד מהמעקב הרפואי, שמבוסס על הגדרות המנהג שתבחרי.',
        items: [
          'הפסק טהרה ושבעה נקיים',
          'תכנון ליל טבילה',
          'עונות פרישה לפי מנהג',
          'חישוב לפי זריחה ושקיעה בעיר שתבחרי',
        ],
      },
    ],
  },
  {
    key: 'insights',
    href: '/insights',
    label: 'תובנות',
    title: 'תובנות ותחזיות',
    description: 'ממוצעים, מגמות וחלון פוריות משוער.',
    status: 'planned',
    stage: 'יתווסף בשלב 4',
    primary: false,
    sections: [
      {
        title: 'תובנות',
        summary: 'יוצגו רק אחרי שיצטברו מספיק נתונים אמיתיים, ותמיד יסומנו כהערכה.',
        items: ['אורך מחזור ממוצע', 'ביוץ וחלון פוריות משוערים', 'גרפים לאורך זמן'],
      },
    ],
  },
  {
    key: 'import',
    href: '/import',
    label: 'ייבוא',
    title: 'ייבוא מהגרסה הקודמת',
    description: 'העברת נתונים מקובץ גיבוי של גרסת TAHARA הקודמת.',
    status: 'planned',
    stage: 'יתווסף בשלב 8',
    primary: false,
    sections: [
      {
        title: 'ייבוא בטוח',
        summary: 'הקובץ נקרא ומפוענח במכשיר שלך, וקוד הנעילה אינו נשלח לשרת.',
        items: [
          'בדיקת תקינות ודוח מקדים לפני כל שמירה',
          'גיבוי אוטומטי של הנתונים הקיימים לפני הייבוא',
          'ייבוא בפעולה אחת, עם אפשרות לבטל אותו',
        ],
      },
    ],
  },
  {
    key: 'support',
    href: '/support',
    label: 'תמיכה',
    title: 'תמיכה',
    description: 'פנייה לצוות התמיכה בנושאי חשבון ורכישה.',
    status: 'planned',
    stage: 'יתווסף בשלב 7',
    primary: false,
    sections: [
      {
        title: 'פניות',
        summary: 'צוות התמיכה רואה רק את מה שתכתבי בפנייה. אין לו גישה למעקב האישי שלך.',
        items: ['פתיחת פנייה ומעקב אחר סטטוס', 'מומלץ לא לכלול מידע רפואי בפנייה'],
      },
    ],
  },
  {
    key: 'settings',
    href: '/settings',
    label: 'הגדרות',
    title: 'הגדרות',
    description: 'תצוגה, מיקום, פרטיות וחשבון.',
    status: 'planned',
    stage: 'יתווסף בשלבים 2–8',
    primary: true,
    sections: [
      {
        title: 'תצוגה ומיקום',
        summary: 'המיקום נבחר מרשימת ערים. האפליקציה לא מבקשת מיקום GPS.',
        items: ['תאריך עברי, לועזי או שניהם', 'בחירת עיר לחישוב זריחה ושקיעה'],
      },
      {
        title: 'פרטיות וחשבון',
        summary: 'שליטה מלאה בנתונים שלך.',
        items: [
          'ייצוא מלא של הנתונים',
          'מחיקת החשבון וכל הנתונים',
          'כניסה בקישור מאובטח במייל, בלי סיסמה',
        ],
      },
    ],
  },
];

export const PRIMARY_NAV = APP_FEATURES.filter((f) => f.primary);

export function getFeature(key: FeatureKey): AppFeature {
  const f = APP_FEATURES.find((x) => x.key === key);
  if (!f) throw new Error(`Unknown feature: ${key}`);
  return f;
}
