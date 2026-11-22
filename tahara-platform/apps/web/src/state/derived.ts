'use client';

import { useMemo } from 'react';
import { formatDate, type ISODate } from '@tahara/core/calendar';
import { cycleStats, predict, type CycleStats, type Prediction } from '@tahara/core/medical-engine';
import { taharaStatus, type TaharaStatus } from '@/features/tahara/tracking';
import { useTahara } from './store';

export interface Derived {
  prediction: Prediction;
  stats: CycleStats;
  tahara: TaharaStatus;
  fmt: (d: ISODate, opts?: { year?: boolean; weekday?: boolean }) => string;
}

/** Medical estimates and halachic documentation status, computed separately. */
export function useDerived(): Derived {
  const { data, today } = useTahara();
  return useMemo(() => {
    const prefs = data.preferences;
    const tests = data.fertilityLogs
      .filter((l) => l.lh)
      .map((l) => ({ date: l.date, result: l.lh! }));
    return {
      prediction: predict(
        data.periods,
        today,
        {
          declaredCycleLength: prefs.declaredCycleLength,
          lutealDays: prefs.lutealDays,
          method: prefs.method,
        },
        tests,
      ),
      stats: cycleStats(data.periods),
      tahara: taharaStatus(data, today),
      fmt: (d, opts) => formatDate(d, prefs.dateDisplay, opts),
    };
  }, [data, today]);
}
