'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ISODate } from '@tahara/core/calendar';
import type { BedikaPart, FertilityLog, Hefsek, Period, SymptomLog } from '@/domain/types';
import { Sheet } from '@/components/app/Sheet';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';
import { BedikaForm } from './BedikaForm';
import { FertilityForm } from './FertilityForm';
import { HefsekForm } from './HefsekForm';
import { PeriodForm } from './PeriodForm';
import { SymptomForm } from './SymptomForm';
import { TevilaForm } from './TevilaForm';

export type SheetRequest =
  | { kind: 'period'; existing?: Period; date?: ISODate }
  | { kind: 'symptom'; existing?: SymptomLog; date?: ISODate }
  | { kind: 'fertility'; existing?: FertilityLog; date?: ISODate; focus?: 'lh' }
  | { kind: 'hefsek'; existing?: Hefsek; date?: ISODate }
  | { kind: 'bedika'; day?: number; part?: BedikaPart }
  | { kind: 'tevila' };

const Ctx = createContext<{ open: (r: SheetRequest) => void } | null>(null);

const TITLES: Record<SheetRequest['kind'], string> = {
  period: 'תיעוד מחזור',
  symptom: 'תיעוד תסמין',
  fertility: 'תיעוד פוריות',
  hefsek: 'הפסק טהרה',
  bedika: 'תיעוד בדיקה',
  tevila: 'טבילה',
};

/** One place that renders the active form sheet, so any screen can open any form. */
export function ActionSheetsProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<SheetRequest | null>(null);
  const [key, setKey] = useState(0);
  const { notify } = useTahara();
  const { tahara } = useDerived();
  const value = useMemo(
    () => ({
      open: (r: SheetRequest) => {
        if ((r.kind === 'bedika' || r.kind === 'tevila') && !tahara.hefsek) {
          notify('יש לתעד קודם הפסק טהרה', 'info');
          return;
        }
        setKey((k) => k + 1);
        setReq(r);
      },
    }),
    [tahara.hefsek, notify],
  );
  const close = () => setReq(null);

  let title = req ? TITLES[req.kind] : '';
  if (req && 'existing' in req && req.existing) title = `עריכת ${title.replace('תיעוד ', '')}`;

  return (
    <Ctx.Provider value={value}>
      {children}
      <Sheet open={!!req} onClose={close} title={title}>
        {req?.kind === 'period' ? (
          <PeriodForm key={key} existing={req.existing} date={req.date} onDone={close} />
        ) : null}
        {req?.kind === 'symptom' ? (
          <SymptomForm key={key} existing={req.existing} date={req.date} onDone={close} />
        ) : null}
        {req?.kind === 'fertility' ? (
          <FertilityForm
            key={key}
            existing={req.existing}
            date={req.date}
            {...(req.focus ? { focus: req.focus } : {})}
            onDone={close}
          />
        ) : null}
        {req?.kind === 'hefsek' ? (
          <HefsekForm key={key} existing={req.existing} date={req.date} onDone={close} />
        ) : null}
        {req?.kind === 'bedika' && tahara.hefsek ? (
          <BedikaForm
            key={key}
            hefsek={tahara.hefsek}
            day={req.day}
            part={req.part}
            onDone={close}
          />
        ) : null}
        {req?.kind === 'tevila' && tahara.hefsek ? (
          <TevilaForm key={key} hefsek={tahara.hefsek} onDone={close} />
        ) : null}
      </Sheet>
    </Ctx.Provider>
  );
}

export function useSheets() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSheets must be used inside ActionSheetsProvider');
  return v;
}
