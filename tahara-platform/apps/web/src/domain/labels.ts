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
  vestot: { title: 'מועדי וסתות', hint: 'רק לכללים שאושרו' },
};

export const DEFAULT_CHECKLIST: readonly string[] = [
  'מקלחת',
  'חפיפת שיער',
  'ניקוי ציפורניים',
  'הסרת לק',
  'בדיקת הגוף',
  'הכנת פריטים אישיים',
];
