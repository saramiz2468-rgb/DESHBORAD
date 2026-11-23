import { describe, expect, it } from 'vitest';
import { addDays, cityById, sameHebrewDayMonthsLater, toHebrewDate } from '../calendar';
import { computeVestot, unuprootedHaflagot } from './compute';
import { MINHAG_PRESETS, RULES } from './rules';
import type { HalachaSettings, SightingInput } from './types';

const J = { ...cityById('jerusalem') };
const BASE: HalachaSettings = {
  minhag: 'sephardi',
  beinonitFullDay: false,
  beinonitDay31: false,
  ohrZarua: false,
  haflagotNotUprooted: false,
};
let n = 0;
const S = (date: string, extra: Partial<SightingInput> = {}): SightingInput => ({
  id: `s${++n}`,
  date,
  onahMode: 'day',
  kind: 'regular',
  ...extra,
});
const run = (s: SightingInput[], settings: Partial<HalachaSettings> = {}, today = '2026-11-23') =>
  computeVestot(s, { ...BASE, ...settings }, J, today);
const kinds = (r: ReturnType<typeof run>) =>
  r.entries.map((e) => `${e.kind}@${e.hdate}/${e.onah}`).sort();

describe('governance', () => {
  it('every rule is pending review and results are flagged as draft', () => {
    for (const r of Object.values(RULES)) expect(r.status).not.toBe('approved');
    expect(run([S('2026-11-14')]).issues.some((i) => i.kind === 'unapproved-rules')).toBe(true);
  });
  it('minhag presets are marked as requiring verification', () => {
    expect(MINHAG_PRESETS.sephardi.status).toBe('requires-verification');
    expect(MINHAG_PRESETS.ashkenazi.status).toBe('requires-verification');
  });
});

describe('28-day cycle (haflagah 29)', () => {
  const r = run([S('2026-09-19'), S('2026-10-17'), S('2026-11-14')]);
  it('haflagah = 29 days counted inclusively from the last sighting', () => {
    const h = r.entries.find((e) => e.kind === 'haflagah')!;
    expect(h.explanation.interval).toBe(29);
    expect(h.hdate).toBe('2026-12-12');
    expect(h.onah).toBe('day');
  });
  it('onah beinonit = day 30 (sighting day is day 1)', () => {
    expect(r.entries.find((e) => e.kind === 'beinonit')!.hdate).toBe('2026-12-13');
  });
  it('veset hachodesh = same Hebrew day next month', () => {
    const c = r.entries.find((e) => e.kind === 'chodesh')!;
    expect(toHebrewDate('2026-11-14')).toMatchObject({ day: 4, month: 'כסלו' });
    expect(toHebrewDate(c.hdate)).toMatchObject({ day: 4, month: 'טבת' });
  });
  it('every entry explains basis, computation, minhag and source', () => {
    for (const e of r.entries) {
      expect(e.explanation.basis.length).toBeGreaterThan(0);
      expect(e.explanation.computation).not.toBe('');
      expect(e.explanation.minhag).toBe('מנהג ספרדי');
      expect(e.explanation.source).toMatch(/יו״ד/);
    }
  });
});

describe('30-day cycle (haflagah 31)', () => {
  it('haflagah and beinonit fall on different days', () => {
    const r = run([S('2026-09-15'), S('2026-10-15'), S('2026-11-14')]);
    expect(r.entries.find((e) => e.kind === 'haflagah')!.hdate).toBe('2026-12-14');
    expect(r.entries.find((e) => e.kind === 'beinonit')!.hdate).toBe('2026-12-13');
  });
});

describe('several reasons on the same onah', () => {
  it('haflagah of 30 coincides with onah beinonit and is grouped', () => {
    const r = run([S('2026-10-16'), S('2026-11-14')]);
    const p = r.prishot.find((x) => x.hdate === '2026-12-13' && x.onah === 'day')!;
    expect(p.entries.map((e) => e.kind).sort()).toEqual(['beinonit', 'haflagah']);
  });
});

describe('variable haflagah and haflagot not uprooted', () => {
  const s = [S('2026-07-01'), S('2026-08-02'), S('2026-08-29'), S('2026-09-27')]; // 33, 28, 30
  it('uses the latest haflagah', () => {
    expect(run(s).entries.find((e) => e.kind === 'haflagah')!.explanation.interval).toBe(30);
  });
  it('adds an earlier longer haflagah only when that option is on', () => {
    expect(unuprootedHaflagot([33, 28, 30])).toEqual([33]);
    expect(unuprootedHaflagot([33, 35, 30])).toEqual([35]);
    expect(run(s).entries.some((e) => e.kind === 'haflagah-old')).toBe(false);
    const old = run(s, { haflagotNotUprooted: true }).entries.find(
      (e) => e.kind === 'haflagah-old',
    )!;
    expect(old.hdate).toBe(addDays('2026-09-27', 32));
  });
});

describe('Hebrew months', () => {
  it('30 Cheshvan in a full year → 30 Kislev', () => {
    expect(toHebrewDate('2024-12-01')).toMatchObject({ day: 30, month: 'חשוון' });
    const c = run([S('2024-12-01')], {}, '2024-12-01').entries.find((e) => e.kind === 'chodesh')!;
    expect(c.hdate).toBe('2024-12-31');
  });
  it('30 Kislev → Tevet has no 30th: no date, and an issue asking to consult', () => {
    const r = run([S('2024-12-31')], {}, '2024-12-31');
    expect(r.entries.some((e) => e.kind === 'chodesh')).toBe(false);
    expect(r.issues.find((i) => i.kind === 'chodesh-missing-day')?.message).toContain('טבת');
  });
  it('Rosh Chodesh (1 Tevet) → 1 Shvat', () => {
    const c = run([S('2025-01-01')], {}, '2025-01-01').entries.find((e) => e.kind === 'chodesh')!;
    expect(toHebrewDate(c.hdate)).toMatchObject({ day: 1, month: 'שבט' });
  });
  it('leap year: 15 Adar I → 15 Adar II; 30 Adar I → missing', () => {
    const c = run([S('2024-02-24')], {}, '2024-02-24').entries.find((e) => e.kind === 'chodesh')!;
    expect(c.hdate).toBe('2024-03-25');
    expect(toHebrewDate('2024-03-10')).toMatchObject({ day: 30, month: 'אדר א׳' });
    expect(
      run([S('2024-03-10')], {}, '2024-03-10').issues.some((i) => i.kind === 'chodesh-missing-day'),
    ).toBe(true);
  });
});

describe('onah by sunrise/sunset (Jerusalem)', () => {
  it('after sunset belongs to the night of the next day', () => {
    const r = run([S('2026-11-14', { onahMode: 'auto', time: '18:30' })]);
    expect(r.resolved[0]).toMatchObject({ hdate: '2026-11-15', onah: 'night' });
    const b = r.entries.find((e) => e.kind === 'beinonit')!;
    expect(b).toMatchObject({ hdate: '2026-12-14', onah: 'night' });
    expect(b.window.from.date).toBe('2026-12-13');
  });
  it('before sunrise is the night of the same day; midday is day', () => {
    expect(run([S('2026-11-14', { onahMode: 'auto', time: '04:00' })]).resolved[0]).toMatchObject({
      hdate: '2026-11-14',
      onah: 'night',
    });
    expect(run([S('2026-11-14', { onahMode: 'auto', time: '12:00' })]).resolved[0]).toMatchObject({
      hdate: '2026-11-14',
      onah: 'day',
    });
  });
  it('flags a sighting close to sunset', () => {
    expect(
      run([S('2026-11-14', { onahMode: 'auto', time: '16:45' })]).issues.some(
        (i) => i.kind === 'near-twilight',
      ),
    ).toBe(true);
  });
  it('unknown time is not computed and asks for the missing data', () => {
    const r = run([S('2026-11-14', { onahMode: 'auto' })]);
    expect(r.entries).toHaveLength(0);
    expect(r.issues.some((i) => i.kind === 'unknown-onah')).toBe(true);
  });
});

describe('complex cases are never computed', () => {
  it.each([
    [{ kind: 'ketem' as const }],
    [{ kind: 'unclear' as const }],
    [{ flags: ['hormones' as const] }],
    [{ flags: ['postpartum' as const] }],
  ])('%o', (extra) => {
    const r = run([S('2026-11-14', extra)]);
    expect(r.entries).toHaveLength(0);
    expect(r.issues.some((i) => i.kind === 'complex-case')).toBe(true);
  });
});

describe('options by minhag / rabbi', () => {
  const s = [S('2026-10-17'), S('2026-11-14')];
  it('onah beinonit for a full day and day 31', () => {
    const k = kinds(run(s, { beinonitFullDay: true, beinonitDay31: true }));
    expect(k).toContain('beinonit-other-onah@2026-12-13/night');
    expect(k).toContain('beinonit-31@2026-12-14/day');
  });
  it('Ohr Zarua adds the preceding onah', () => {
    const r = run(s, { ohrZarua: true });
    expect(kinds(r)).toContain('ohr-zarua@2026-12-13/night'); // before beinonit day of 12-13
  });
});

describe('fixed veset confirmed by a rabbi (personal ruling)', () => {
  const s = [S('2026-09-19'), S('2026-10-17'), S('2026-11-14')];
  it('matching sighting: only the fixed veset, no onah beinonit', () => {
    const r = run(s, { fixedVeset: { type: 'haflagah', value: 29, onah: 'day' } });
    expect(r.entries.map((e) => e.kind)).toEqual(['kavua']);
    expect(r.entries[0]!.hdate).toBe('2026-12-12');
  });
  it('deviating sighting: fixed veset plus non-fixed vestot, with a warning', () => {
    const r = run(s, { fixedVeset: { type: 'haflagah', value: 26, onah: 'day' } });
    expect(r.entries.map((e) => e.kind).sort()).toEqual(['chodesh', 'haflagah', 'kavua']);
    expect(r.issues.some((i) => i.kind === 'deviates-from-fixed')).toBe(true);
  });
});

describe('pattern detection never declares a fixed veset', () => {
  it('three equal haflagot → candidate only', () => {
    const r = run([S('2026-08-22'), S('2026-09-19'), S('2026-10-17'), S('2026-11-14')]);
    expect(r.patterns.map((p) => p.kind)).toContain('haflagah-kavua');
    expect(r.entries.some((e) => e.kind === 'kavua')).toBe(false);
  });
  it('same Hebrew day three months in a row → chodesh candidate', () => {
    const a = '2026-09-19';
    const b = sameHebrewDayMonthsLater(a, 1).date!;
    const c = sameHebrewDayMonthsLater(a, 2).date!;
    expect(run([S(a), S(b), S(c)]).patterns.map((p) => p.kind)).toContain('chodesh-kavua');
  });
  it('increasing haflagot → dilug candidate', () => {
    const r = run([
      S('2026-07-01'),
      S(addDays('2026-07-01', 29)),
      S(addDays('2026-07-01', 29 + 30)),
      S(addDays('2026-07-01', 29 + 30 + 31)),
    ]);
    expect(r.patterns.map((p) => p.kind)).toContain('haflagah-dilug');
  });
});

describe('correcting an earlier sighting recalculates', () => {
  it('moving the second sighting changes the haflagah', () => {
    const a = S('2026-10-17');
    const before = run([S('2026-09-19'), a, S('2026-11-14')]).entries.find(
      (e) => e.kind === 'haflagah',
    )!;
    const after = run([
      S('2026-09-19'),
      { ...a, date: '2026-10-19' },
      S('2026-11-14'),
    ]).entries.find((e) => e.kind === 'haflagah')!;
    expect(before.explanation.interval).toBe(29);
    expect(after.explanation.interval).toBe(27);
    expect(after.hdate).toBe('2026-12-10');
  });
  it('upcoming excludes past onot', () => {
    const r = run([S('2026-09-19'), S('2026-10-17')], {}, '2026-11-23');
    expect(r.upcoming.every((p) => p.window.to.date >= '2026-11-23')).toBe(true);
  });
});
