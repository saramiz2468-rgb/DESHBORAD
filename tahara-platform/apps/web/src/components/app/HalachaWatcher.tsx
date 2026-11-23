'use client';

import { useEffect, useRef } from 'react';
import { useDerived } from '@/state/derived';
import { useTahara } from '@/state/store';

/**
 * Records a calculation-history entry whenever the upcoming separation onot
 * change (new or corrected sighting, minhag or city change). Renders nothing.
 */
export function HalachaWatcher() {
  const { data, addCalcHistory } = useTahara();
  const { vestot } = useDerived();
  const prev = useRef<{ sig: string; sightings: string; settings: string } | null>(null);

  useEffect(() => {
    if (!data.halacha.configured) {
      prev.current = null;
      return;
    }
    const sig = vestot.upcoming
      .map((p) => `${p.hdate}${p.onah}${p.entries.map((e) => e.kind).join()}`)
      .join('|');
    const sightings = data.sightings
      .map((s) => `${s.id}:${s.date}:${s.time}:${s.onahMode}:${s.kind}:${s.flags.join()}`)
      .sort()
      .join('|');
    const settings = JSON.stringify({ ...data.halacha, configured: undefined });
    const p = prev.current;
    prev.current = { sig, sightings, settings };
    if (p && p.sig === sig && p.sightings === sightings && p.settings === settings) return;
    let reason = 'חישוב ראשוני';
    if (p) {
      const before = p.sightings ? p.sightings.split('|').length : 0;
      const after = sightings ? sightings.split('|').length : 0;
      if (after > before) reason = 'נוספה ראייה חדשה';
      else if (after < before) reason = 'נמחקה ראייה';
      else if (p.sightings !== sightings) reason = 'תוקנה ראייה קודמת';
      else if (p.settings !== settings) reason = 'שונו הגדרות המנהג או העיר';
      else return;
    }
    addCalcHistory({ reason, upcoming: vestot.upcoming.length, next: vestot.upcoming[0]?.hdate });
  }, [data.sightings, data.halacha, vestot, addCalcHistory]);

  return null;
}
