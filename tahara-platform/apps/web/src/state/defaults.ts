import type {
  ChecklistItem,
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
  vestot: { enabled: false, time: '08:00' },
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
    checklist: defaultChecklist(),
    reminders: { ...DEFAULT_REMINDERS },
    preferences: { ...DEFAULT_PREFERENCES },
  };
}
