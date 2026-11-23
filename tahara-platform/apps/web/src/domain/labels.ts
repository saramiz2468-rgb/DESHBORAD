import type { ComplexFlag, OnahMode, SightingKind } from '@tahara/core/halacha-engine';
import type { BedikaResult, Flow, MucusKey, ReminderKey, SymptomKey } from './types';

export const FLOW_LABELS: Record<Flow, string> = { light: 'קל', medium: 'בינוני', heavy: 'חזק' };

export const SYMPTOM_LABELS: Record<SymptomKey, string> = {
  'abdominal-pain': 'כאבי בטן',
  'back-pain': 'כאבי גב',
  headache: 'כאבי ראש',
  bloating: 'נפיחות',
  'breast-tenderness': 'רגישות בחזה',
  nausea: 'בחילות',
  fatigue: 'עייפות',
  mood: 'שינויים במצב הרוח',
  constipation: 'עצירות',
  other: 'אחר',
};

export const MUCUS_LABELS: Record<MucusKey, string> = {
  none: 'ללא',
  sticky: 'דביקות',
  creamy: 'קרמיות',
  watery: 'מימיות',
  'egg-white': 'שקופות ונמתחות',
};

export const BEDIKA_RESULT_LABELS: Record<BedikaResult, string> = {
  clean: 'נקייה',
  question: 'יש שאלה (לברר עם רב)',
  'not-clean': 'לא נקייה',
};

export const REMINDER_LABELS: Record<ReminderKey, { title: string; hint: string }> = {
  period: { title: 'מחזור צפוי', hint: 'יום לפני המועד המשוער' },
  hefsek: { title: 'הפסק טהרה', hint: 'בשעה שתבחרי' },
  'seven-days': { title: 'מעקב שבעה נקיים', hint: 'בוקר וערב' },
  tevila: { title: 'טבילה', hint: 'ביום הטבילה שתכנני' },
  'fertile-window': { title: 'חלון פוריות', hint: 'בתחילת החלון המשוער' },
  ovulation: { title: 'ביוץ משוער', hint: 'ביום המשוער' },
  'lh-test': { title: 'בדיקת ביוץ', hint: 'בימים שלפני הביוץ המשוער' },
  'prishah-before': { title: 'יום לפני מועד פרישה', hint: 'ערב לפני כל מועד' },
  'prishah-day': { title: 'ביום הפרישה', hint: 'בבוקר של יום הפרישה' },
  recalc: { title: 'כשהמועדים מחושבים מחדש', hint: 'אחרי ראייה חדשה או תיקון' },
  pattern: { title: 'כשמזוהה דפוס של וסת קבוע', hint: 'כדי לברר עם רב' },
  'missing-data': { title: 'כשחסרים נתונים לחישוב', hint: 'למשל שעה או עונה של ראייה' },
};

export const DEFAULT_CHECKLIST: readonly string[] = [
  'מקלחת',
  'חפיפת שיער',
  'ניקוי ציפורניים',
  'הסרת לק',
  'בדיקת הגוף',
  'הכנת פריטים אישיים',
];

export const ONAH_MODE_LABELS: Record<OnahMode, string> = {
  auto: 'אוטומטי לפי השעה והעיר',
  day: 'עונת יום (בין הזריחה לשקיעה)',
  'night-before-sunrise': 'עונת לילה – לפני הזריחה',
  'night-after-sunset': 'עונת לילה – אחרי השקיעה',
  unknown: 'לא ידוע',
};

export const SIGHTING_KIND_LABELS: Record<SightingKind, string> = {
  regular: 'ראייה',
  ketem: 'כתם',
  unclear: 'דימום לא ברור',
};

export const COMPLEX_FLAG_LABELS: Record<ComplexFlag, string> = {
  hormones: 'נטילת הורמונים',
  postpartum: 'אחרי לידה',
  miscarriage: 'אחרי הפלה',
  pregnancy: 'היריון',
  nursing: 'הנקה',
};
