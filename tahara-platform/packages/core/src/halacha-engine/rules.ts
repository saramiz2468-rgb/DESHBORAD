/**
 * Rule registry and minhag presets.
 *
 * Every rule is `pending-review` until a qualified halachic authority checks
 * the rule, its test cases and its source, and records the approval here
 * (approvedBy / approvedAt). The UI must show unapproved results only as a
 * draft for review. See docs/halacha-rules-governance.md.
 *
 * Sources are given at siman level (Shulchan Aruch Yoreh De'ah 184–189 and
 * its commentaries). Exact se'if references are part of the review.
 */
import type { EntryKind, HalachaSettings, MinhagKey } from './types';

export type RuleStatus = 'draft' | 'pending-review' | 'approved';

export interface Rule {
  id: string;
  name: string;
  summary: string;
  source: string;
  status: RuleStatus;
  approvedBy?: string;
  approvedAt?: string;
}

export const RULES: Record<string, Rule> = {
  onah: {
    id: 'onah',
    name: 'עונת יום ועונת לילה',
    summary:
      'עונת יום מהזריחה עד השקיעה; עונת לילה מהשקיעה עד הזריחה. ראייה אחרי השקיעה שייכת ללילה של היום הבא.',
    source: 'שו״ע יו״ד סימן קפד',
    status: 'pending-review',
  },
  chodesh: {
    id: 'chodesh',
    name: 'וסת החודש',
    summary: 'חוששת לאותו יום בחודש העברי הבא, באותה עונה שבה התחילה הראייה.',
    source: 'שו״ע יו״ד סימן קפט ונושאי כלים',
    status: 'pending-review',
  },
  haflagah: {
    id: 'haflagah',
    name: 'וסת ההפלגה',
    summary:
      'מספר הימים מתחילת ראייה לתחילת הראייה הבאה, כולל שני הימים; חוששת לאותו מרחק מהראייה האחרונה, באותה עונה.',
    source: 'שו״ע יו״ד סימן קפט ונושאי כלים',
    status: 'pending-review',
  },
  'haflagah-old': {
    id: 'haflagah-old',
    name: 'הפלגה שלא נעקרה',
    summary: 'הפלגה ארוכה קודמת שעדיין לא נעקרה (לא עבר עליה מועד בלי ראייה), לפי הוראת רב.',
    source: 'נושאי הכלים על שו״ע יו״ד סימן קפט',
    status: 'pending-review',
  },
  beinonit: {
    id: 'beinonit',
    name: 'עונה בינונית',
    summary: 'היום ה-30 מתחילת הראייה (יום הראייה הוא יום 1), באותה עונה.',
    source: 'שו״ע יו״ד סימן קפט ונושאי כלים',
    status: 'pending-review',
  },
  'beinonit-other-onah': {
    id: 'beinonit-other-onah',
    name: 'עונה בינונית – מעת לעת',
    summary: 'חומרה לפרוש גם בעונה השנייה של היום ה-30, לפי המנהג או הוראת רב.',
    source: 'נושאי הכלים על שו״ע יו״ד סימן קפט',
    status: 'pending-review',
  },
  'beinonit-31': {
    id: 'beinonit-31',
    name: 'עונה בינונית – יום 31',
    summary: 'חומרה לחשוש גם ליום ה-31, לפי המנהג או הוראת רב.',
    source: 'נושאי הכלים על שו״ע יו״ד סימן קפט',
    status: 'pending-review',
  },
  'ohr-zarua': {
    id: 'ohr-zarua',
    name: 'חומרת אור זרוע',
    summary: 'פרישה גם בעונה שלפני עונת הווסת, לפי המנהג או הוראת רב.',
    source: 'נושאי הכלים על שו״ע יו״ד סימן קפד',
    status: 'pending-review',
  },
  kavua: {
    id: 'kavua',
    name: 'וסת קבוע (לפי הוראת רב)',
    summary:
      'וסת שנקבע לאחר שלוש פעמים בתנאים ההלכתיים, וקביעתו אושרה על ידי רב. בזמן וסת קבוע אין חוששים לעונה בינונית.',
    source: 'שו״ע יו״ד סימן קפט',
    status: 'pending-review',
  },
  patterns: {
    id: 'patterns',
    name: 'זיהוי דפוסים',
    summary: 'האפליקציה מזהה דפוס העשוי ליצור וסת קבוע, ואינה קובעת וסת קבוע בעצמה.',
    source: 'שו״ע יו״ד סימן קפט',
    status: 'pending-review',
  },
};

export const ENTRY_RULE: Record<EntryKind, string> = {
  chodesh: 'chodesh',
  haflagah: 'haflagah',
  'haflagah-old': 'haflagah-old',
  beinonit: 'beinonit',
  'beinonit-other-onah': 'beinonit-other-onah',
  'beinonit-31': 'beinonit-31',
  'ohr-zarua': 'ohr-zarua',
  kavua: 'kavua',
};

export function allApproved(ids: readonly string[] = Object.keys(RULES)): boolean {
  return ids.every((id) => RULES[id]?.status === 'approved');
}

export const MINHAG_LABELS: Record<MinhagKey, string> = {
  sephardi: 'מנהג ספרדי',
  ashkenazi: 'מנהג אשכנזי',
  personal: 'מנהג אישי לפי הוראת רב',
};

/**
 * Starting points only, NOT rulings: commonly cited practice, status
 * `requires-verification`. The user can change every option, and the
 * reviewing authority must confirm or correct these defaults before launch.
 * Families and communities differ – the app never assumes a whole community
 * acts alike.
 */
export const MINHAG_PRESETS: Record<
  Exclude<MinhagKey, 'personal'>,
  {
    status: 'requires-verification';
    note: string;
    values: Omit<HalachaSettings, 'minhag' | 'fixedVeset'>;
  }
> = {
  sephardi: {
    status: 'requires-verification',
    note: 'הצעה לפי שיטת השולחן ערוך: עונה בינונית ביום ה-30 בעונת הראייה בלבד, בלי חומרות נוספות.',
    values: {
      beinonitFullDay: false,
      beinonitDay31: false,
      ohrZarua: false,
      haflagotNotUprooted: false,
    },
  },
  ashkenazi: {
    status: 'requires-verification',
    note: 'הצעה לפי חומרות המובאות אצל פוסקי אשכנז: עונה בינונית מעת לעת וחומרת אור זרוע.',
    values: {
      beinonitFullDay: true,
      beinonitDay31: false,
      ohrZarua: true,
      haflagotNotUprooted: false,
    },
  },
};

export const COMPLEX_CASE_MESSAGE =
  'המקרה דורש בירור הלכתי אישי. האפליקציה אינה מחשבת מועדים על סמך כתמים, דימום לא ברור, נטילת הורמונים, לידה, הפלה, היריון או הנקה.';
