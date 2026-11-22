'use client';

import { useId } from 'react';
import { SCENARIOS, type ScenarioKey } from '@/state/scenarios';
import { useTahara } from '@/state/store';

/**
 * Always-visible label for stage A: data lives only in this tab's memory.
 * The scenario picker loads clearly-labelled demo data for design review.
 */
export function SimulationBar() {
  const { scenario, loadScenario, isDemo } = useTahara();
  const id = useId();
  return (
    <div
      role="region"
      aria-label="מצב הדגמה"
      className="border-b border-gold-soft bg-gold-soft/35 px-4 py-2 text-[0.78rem] leading-snug text-ink-soft"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <p>
          <strong className="font-semibold text-ink">מצב הדגמה.</strong>{' '}
          {isDemo ? 'מוצגים נתוני הדגמה, לא נתונים אמיתיים. ' : ''}
          הנתונים נשמרים רק בלשונית הזו ונמחקים ברענון.
        </p>
        <label htmlFor={id} className="flex items-center gap-2">
          <span className="whitespace-nowrap">תרחיש:</span>
          <select
            id={id}
            value={scenario}
            onChange={(e) => loadScenario(e.target.value as ScenarioKey)}
            className="min-h-8 rounded-pill border border-gold-soft bg-surface px-3 text-[0.78rem] text-ink"
          >
            {SCENARIOS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
