/**
 * Admin modules (stage 1: all planned, no data source connected).
 *
 * Privacy boundary – enforced in the database, not only here:
 * the admin role has NO grants or RLS policies on the `med` and `hal` schemas.
 * The admin app never receives the Supabase service-role key; it calls
 * restricted RPCs in the `admin` schema (is_admin() + MFA/aal2 + audit log).
 */
export type AdminModuleKey =
  | 'dashboard'
  | 'purchases'
  | 'revenue'
  | 'users'
  | 'entitlements'
  | 'refunds'
  | 'coupons'
  | 'support'
  | 'audit';

export interface AdminModule {
  key: AdminModuleKey;
  href: `/${string}`;
  label: string;
  description: string;
  status: 'planned';
  /** What the module will show. Must never include personal medical/halachic content. */
  fields: readonly string[];
  actions: readonly string[];
}

export const ADMIN_MODULES: readonly AdminModule[] = [
  {
    key: 'dashboard',
    href: '/dashboard',
    label: 'לוח בקרה',
    description: 'מדדים עסקיים מצטברים.',
    status: 'planned',
    fields: [
      'מספר רכישות',
      'הכנסות ברוטו ונטו (אחרי החזרים)',
      'מספר בעלות זכאות פעילה',
      'פניות פתוחות',
    ],
    actions: [],
  },
  {
    key: 'purchases',
    href: '/purchases',
    label: 'רכישות',
    description: 'כל הרכישות כפי שאושרו אצל ספק התשלום.',
    status: 'planned',
    fields: ['מייל', 'מוצר', 'סכום ומטבע', 'סטטוס', 'אסמכתה אצל הספק', 'מספר חשבונית', 'תאריך'],
    actions: ['חיפוש וסינון', 'ייצוא לרואה חשבון'],
  },
  {
    key: 'revenue',
    href: '/revenue',
    label: 'הכנסות',
    description: 'הכנסות לפי תקופה, בניכוי החזרים.',
    status: 'planned',
    fields: ['הכנסות לפי חודש', 'החזרים', 'שימוש בקופונים'],
    actions: ['בחירת טווח תאריכים'],
  },
  {
    key: 'users',
    href: '/users',
    label: 'משתמשות',
    description: 'פרטי חשבון בלבד, בלי שום תוכן אישי.',
    status: 'planned',
    fields: ['מייל', 'תאריך הצטרפות', 'כניסה אחרונה', 'סטטוס זכאות'],
    actions: ['שליחה מחדש של קישור כניסה'],
  },
  {
    key: 'entitlements',
    href: '/entitlements',
    label: 'זכאויות',
    description: 'גישה לכל החיים, בלי תפוגה אוטומטית. כל שינוי מתועד ביומן.',
    status: 'planned',
    fields: ['משתמשת', 'מקור (רכישה או הענקה ידנית)', 'סטטוס', 'היסטוריית שינויים'],
    actions: ['הענקה ידנית עם סיבה', 'ביטול מסיבה מוגדרת', 'שחזור זכאות'],
  },
  {
    key: 'refunds',
    href: '/refunds',
    label: 'החזרים',
    description: 'מבקשה ועד אישור ספק התשלום.',
    status: 'planned',
    fields: ['בקשה', 'סטטוס', 'סכום', 'השפעה על הזכאות'],
    actions: ['אישור או דחייה', 'ביצוע ההחזר אצל הספק (שלב 6)'],
  },
  {
    key: 'coupons',
    href: '/coupons',
    label: 'קופונים',
    description: 'קודי הנחה. תוקף הקופון לא משפיע על הזכאות.',
    status: 'planned',
    fields: ['קוד', 'סוג הנחה וערך', 'מכסת שימושים', 'טווח תאריכים', 'מספר מימושים'],
    actions: ['יצירה', 'השבתה'],
  },
  {
    key: 'support',
    href: '/support',
    label: 'פניות תמיכה',
    description: 'רק פניות שמשתמשות שלחו ביוזמתן.',
    status: 'planned',
    fields: ['נושא', 'תוכן הפנייה', 'סטטוס', 'תאריכים'],
    actions: ['מענה', 'שינוי סטטוס'],
  },
  {
    key: 'audit',
    href: '/audit',
    label: 'יומן ביקורת',
    description: 'תיעוד של כל פעולת ניהול.',
    status: 'planned',
    fields: ['מבצעת', 'פעולה', 'יעד', 'סיבה', 'מועד'],
    actions: ['חיפוש (קריאה בלבד)'],
  },
];

/** Words that must never appear in an admin module's data fields. */
export const FORBIDDEN_ADMIN_FIELDS = [
  'מחזור',
  'דימום',
  'ביוץ',
  'פוריות',
  'וסת',
  'הפסק',
  'טבילה',
  'בדיקה',
  'תסמין',
  'הערות אישיות',
] as const;
