/**
 * Records the user enters. Mirrors the planned DB tables:
 *   medical  → med.periods, med.daily_logs (symptoms, fertility)
 *   halachic → hal.hefsek, hal.bedikot, hal.tevila, hal.checklist
 * The two domains never reference each other.
 */
import type { DateDisplay, ISODate } from '@tahara/core/calendar';
import type {
  ComplexFlag,
  HalachaSettings,
  OnahMode,
  SightingKind,
} from '@tahara/core/halacha-engine';

export type Flow = 'light' | 'medium' | 'heavy';

export type SymptomKey =
  | 'abdominal-pain'
  | 'back-pain'
  | 'headache'
  | 'bloating'
  | 'breast-tenderness'
  | 'nausea'
  | 'fatigue'
  | 'mood'
  | 'constipation'
  | 'other';

export type MucusKey = 'none' | 'sticky' | 'creamy' | 'watery' | 'egg-white';

/* ---------- medical ---------- */

export interface Period {
  id: string;
  start: ISODate;
  startTime?: string | undefined;
  end?: ISODate | undefined;
  bleedDays?: number | undefined;
  flow?: Flow | undefined;
  symptoms: SymptomKey[];
  otherSymptom?: string | undefined;
  notes?: string | undefined;
}

export interface SymptomLog {
  id: string;
  date: ISODate;
  symptoms: SymptomKey[];
  otherSymptom?: string | undefined;
  notes?: string | undefined;
}

export interface FertilityLog {
  id: string;
  date: ISODate;
  lh?: 'positive' | 'negative' | undefined;
  mucus?: MucusKey | undefined;
  ovulationPain?: boolean | undefined;
  bbt?: number | undefined;
  symptoms: SymptomKey[];
  notes?: string | undefined;
}

/* ---------- halachic tracking (documentation only – no rulings) ---------- */

export interface Hefsek {
  id: string;
  date: ISODate;
  time?: string | undefined;
  performed: boolean;
  notes?: string | undefined;
}

export type BedikaPart = 'morning' | 'evening';
/** What the user records. The app never infers a halachic status from it. */
export type BedikaResult = 'clean' | 'question' | 'not-clean';

export interface Bedika {
  id: string;
  hefsekId: string;
  /** Slot 1–7 chosen by the user. */
  day: number;
  part: BedikaPart;
  date: ISODate;
  result: BedikaResult;
  notes?: string | undefined;
}

export interface Tevila {
  id: string;
  hefsekId: string;
  planned?: ISODate | undefined;
  actual?: ISODate | undefined;
  done: boolean;
  notes?: string | undefined;
}

/** A sighting (ראייה) for halachic tracking. Optionally linked to a medical period record. */
export interface Sighting {
  id: string;
  date: ISODate;
  time?: string | undefined;
  onahMode: OnahMode;
  kind: SightingKind;
  flags: ComplexFlag[];
  periodId?: string | undefined;
  notes?: string | undefined;
}

export interface HalachaPrefs extends HalachaSettings {
  /** False until the user chose her minhag in settings. */
  configured: boolean;
  cityId: string;
  rabbiNote?: string | undefined;
}

export interface CalcHistoryEntry {
  id: string;
  at: string;
  reason: string;
  upcoming: number;
  next?: ISODate | undefined;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  custom: boolean;
}

/* ---------- settings ---------- */

export type ReminderKey =
  | 'period'
  | 'hefsek'
  | 'seven-days'
  | 'tevila'
  | 'fertile-window'
  | 'ovulation'
  | 'lh-test'
  | 'prishah-before'
  | 'prishah-day'
  | 'recalc'
  | 'pattern'
  | 'missing-data';

export interface ReminderSetting {
  enabled: boolean;
  time: string;
}

export interface Preferences {
  dateDisplay: DateDisplay;
  declaredCycleLength?: number | undefined;
  declaredBleedDays?: number | undefined;
  lutealDays: number;
  method: 'average' | 'recent3';
  neutralNotifications: boolean;
}

export interface TaharaData {
  periods: Period[];
  symptomLogs: SymptomLog[];
  fertilityLogs: FertilityLog[];
  hefseks: Hefsek[];
  bedikot: Bedika[];
  tevilot: Tevila[];
  sightings: Sighting[];
  halacha: HalachaPrefs;
  checklist: ChecklistItem[];
  reminders: Record<ReminderKey, ReminderSetting>;
  preferences: Preferences;
}
