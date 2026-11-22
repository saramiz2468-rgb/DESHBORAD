import type { ISODate } from '../calendar';

/** Minimal shape the engine needs. Independent of storage and UI. */
export interface PeriodInput {
  start: ISODate;
  end?: ISODate | undefined;
  bleedDays?: number | undefined;
}

export interface OvulationTestInput {
  date: ISODate;
  result: 'positive' | 'negative';
}

export interface EngineSettings {
  /** Cycle length the user declared (used only when history is insufficient). */
  declaredCycleLength?: number | undefined;
  declaredBleedDays?: number | undefined;
  /** Days from ovulation to next period. Default 14. */
  lutealDays?: number | undefined;
  /** 'average' = up to the 6 recent cycles; 'recent3' = last 3 cycles. */
  method?: 'average' | 'recent3' | undefined;
}

export type EstimateBasis = 'history' | 'declared' | 'none';

export interface CycleStats {
  count: number;
  lengths: number[];
  averageLength: number | null;
  shortest: number | null;
  longest: number | null;
  averageBleed: number | null;
  /** Spread between shortest and longest cycle. */
  spread: number | null;
  irregular: boolean;
}

export interface Prediction {
  basis: EstimateBasis;
  lastStart: ISODate | null;
  dayOfCycle: number | null;
  cycleLength: number | null;
  nextStart: ISODate | null;
  nextStartRange: [ISODate, ISODate] | null;
  ovulation: ISODate | null;
  ovulationSource: 'lh' | 'calendar' | null;
  fertileWindow: [ISODate, ISODate] | null;
  daysUntilNext: number | null;
  daysUntilOvulation: number | null;
  irregular: boolean;
  /** The predicted start has passed without a recorded period. */
  late: boolean;
}
