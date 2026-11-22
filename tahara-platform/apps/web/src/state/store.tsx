'use client';

/**
 * Stage-A in-memory store.
 *
 * Holds data ONLY in React state of the open tab. Nothing is written to
 * localStorage, sessionStorage, IndexedDB, cookies or the network; a reload
 * clears everything. In stage B this provider is replaced by server actions
 * backed by Supabase (RLS), keeping the same action names.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { todayInJerusalem, type ISODate } from '@tahara/core/calendar';
import type {
  Bedika,
  ChecklistItem,
  FertilityLog,
  Hefsek,
  Period,
  Preferences,
  ReminderKey,
  ReminderSetting,
  SymptomLog,
  TaharaData,
  Tevila,
} from '@/domain/types';
import { emptyData } from './defaults';
import { buildScenario, type ScenarioKey } from './scenarios';

type Collection = 'periods' | 'symptomLogs' | 'fertilityLogs' | 'hefseks' | 'bedikot' | 'tevilot';
type ItemOf<C extends Collection> = TaharaData[C][number];

type Action =
  | { type: 'upsert'; collection: Collection; item: { id: string } }
  | { type: 'remove'; collection: Collection; id: string }
  | { type: 'preferences'; patch: Partial<Preferences> }
  | { type: 'reminder'; key: ReminderKey; patch: Partial<ReminderSetting> }
  | { type: 'checklist'; items: ChecklistItem[] }
  | { type: 'replace'; data: TaharaData };

function reducer(state: TaharaData, a: Action): TaharaData {
  switch (a.type) {
    case 'upsert': {
      const list = state[a.collection] as Array<{ id: string }>;
      const exists = list.some((x) => x.id === a.item.id);
      return {
        ...state,
        [a.collection]: exists
          ? list.map((x) => (x.id === a.item.id ? a.item : x))
          : [...list, a.item],
      };
    }
    case 'remove': {
      const list = state[a.collection] as Array<{ id: string }>;
      const next = { ...state, [a.collection]: list.filter((x) => x.id !== a.id) };
      // Deleting a hefsek removes its own documentation (same domain only).
      if (a.collection === 'hefseks') {
        next.bedikot = state.bedikot.filter((b) => b.hefsekId !== a.id);
        next.tevilot = state.tevilot.filter((t) => t.hefsekId !== a.id);
      }
      return next;
    }
    case 'preferences':
      return { ...state, preferences: { ...state.preferences, ...a.patch } };
    case 'reminder':
      return {
        ...state,
        reminders: { ...state.reminders, [a.key]: { ...state.reminders[a.key], ...a.patch } },
      };
    case 'checklist':
      return { ...state, checklist: a.items };
    case 'replace':
      return a.data;
  }
}

export interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'error';
  undo?: (() => void) | undefined;
}

interface StoreValue {
  data: TaharaData;
  today: ISODate;
  scenario: ScenarioKey;
  isDemo: boolean;
  save<C extends Collection>(collection: C, item: ItemOf<C>, message?: string): void;
  remove(collection: Collection, id: string, message: string): void;
  setPreferences(patch: Partial<Preferences>): void;
  setReminder(key: ReminderKey, patch: Partial<ReminderSetting>): void;
  setChecklist(items: ChecklistItem[]): void;
  loadScenario(key: ScenarioKey): void;
  resetAll(): void;
  toasts: Toast[];
  notify(message: string, tone?: Toast['tone'], undo?: () => void): void;
  dismiss(id: number): void;
  drafts: Record<string, unknown>;
  setDraft(key: string, value: unknown): void;
  clearDraft(key: string): void;
}

const Ctx = createContext<StoreValue | null>(null);

export function newId(): string {
  return crypto.randomUUID();
}

export function TaharaStoreProvider({ children }: { children: ReactNode }) {
  const [today] = useState(() => todayInJerusalem());
  const [scenario, setScenario] = useState<ScenarioKey>('new');
  const [data, dispatch] = useReducer(reducer, undefined, emptyData);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [drafts, setDrafts] = useState<Record<string, unknown>>({});
  const toastId = useRef(0);
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback(
    (message: string, tone: Toast['tone'] = 'success', undo?: () => void) => {
      const id = ++toastId.current;
      setToasts((t) => [...t.slice(-2), { id, message, tone, undo }]);
      setTimeout(() => dismiss(id), undo ? 6000 : 3500);
    },
    [dismiss],
  );

  const value = useMemo<StoreValue>(
    () => ({
      data,
      today,
      scenario,
      isDemo: scenario !== 'new',
      save(collection, item, message) {
        dispatch({ type: 'upsert', collection, item });
        if (message) notify(message);
      },
      remove(collection, id, message) {
        const snapshot = dataRef.current;
        dispatch({ type: 'remove', collection, id });
        notify(message, 'info', () => dispatch({ type: 'replace', data: snapshot }));
      },
      setPreferences: (patch) => dispatch({ type: 'preferences', patch }),
      setReminder: (key, patch) => dispatch({ type: 'reminder', key, patch }),
      setChecklist: (items) => dispatch({ type: 'checklist', items }),
      loadScenario(key) {
        setScenario(key);
        setDrafts({});
        dispatch({ type: 'replace', data: buildScenario(key, today) });
      },
      resetAll() {
        setScenario('new');
        setDrafts({});
        dispatch({ type: 'replace', data: emptyData() });
      },
      toasts,
      notify,
      dismiss,
      drafts,
      setDraft: (key, v) => setDrafts((d) => ({ ...d, [key]: v })),
      clearDraft: (key) =>
        setDrafts((d) => {
          const next = { ...d };
          delete next[key];
          return next;
        }),
    }),
    [data, today, scenario, toasts, notify, dismiss, drafts],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTahara(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTahara must be used inside TaharaStoreProvider');
  return v;
}

export type { Bedika, FertilityLog, Hefsek, Period, SymptomLog, Tevila };
