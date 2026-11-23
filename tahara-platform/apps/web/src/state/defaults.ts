import { DEFAULT_CITY_ID } from '@tahara/core/calendar';
import type {
  ChecklistItem,
  HalachaPrefs,
  Preferences,
  ReminderKey,
  ReminderSetting,
  TaharaData,
} from '@/domain/types';
import { DEFAULT_CHECKLIST } from '@/domain/labels';

export const DEFAULT_PREFERENCES: Preferences = {
  dateDisplay: 'both',
  lutealDays: 14,
  method: 'average',
  neutralNotifications: true,
};

export const DEFAULT_REMINDERS: Record<ReminderKey, ReminderSetting> = {
  period: { enabled: false, time: '09:00' },
  hefsek: { enabled: false, time: '16:00' },
  'seven-days': { enabled: false, time: '08:00' },
  tevila: { enabled: false, time: '18:00' },
  'fertile-window': { enabled: false, time: '09:00' },
  ovulation: { enabled: false, time: '09:00' },
  'lh-test': { enabled: false, time: '10:00' },
  'prishah-before': { enabled: false, time: '20:00' },
  'prishah-day': { enabled: false, time: '08:00' },
  recalc: { enabled: true, time: '09:00' },
  pattern: { enabled: true, time: '09:00' },
  'missing-data': { enabled: true, time: '09:00' },
};

export const DEFAULT_HALACHA: HalachaPrefs = {
  configured: false,
  minhag: 'personal',
  beinonitFullDay: false,
  beinonitDay31: false,
  ohrZarua: false,
  haflagotNotUprooted: false,
  fixedVeset: null,
  cityId: DEFAULT_CITY_ID,
};

export function defaultChecklist(): ChecklistItem[] {
  return DEFAULT_CHECKLIST.map((text, i) => ({
    id: `default-${i}`,
    text,
    done: false,
    custom: false,
  }));
}

export function emptyData(): TaharaData {
  return {
    periods: [],
    symptomLogs: [],
    fertilityLogs: [],
    hefseks: [],
    bedikot: [],
    tevilot: [],
    sightings: [],
    halacha: { ...DEFAULT_HALACHA },
    checklist: defaultChecklist(),
    reminders: { ...DEFAULT_REMINDERS },
    preferences: { ...DEFAULT_PREFERENCES },
  };
}
