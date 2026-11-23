import {
  addDays,
  diffDays,
  formatDate,
  formatHebrew,
  hebrewMonthLength,
  nextHebrewMonthStart,
  sameHebrewDayMonthsLater,
  startOfHebrewMonth,
  toHebrewDate,
  type ISODate,
} from '../calendar';
import { detectPatterns } from './patterns';
import { onahWindow, ONAH_LABEL, previousOnah, resolveSighting } from './onah';
import { allApproved, COMPLEX_CASE_MESSAGE, ENTRY_RULE, MINHAG_LABELS, RULES } from './rules';
import type {
  EntryKind,
  HalachaSettings,
  Issue,
  Location,
  Onah,
  Prishah,
  ResolvedSighting,
  SightingInput,
  VesetEntry,
  VestotResult,
} from './types';

const LABELS: Record<EntryKind, string> = {
  chodesh: 'וסת החודש',
  haflagah: 'וסת ההפלגה',
  'haflagah-old': 'הפלגה שלא נעקרה',
  beinonit: 'עונה בינונית',
  'beinonit-other-onah': 'עונה בינונית – העונה השנייה',
  'beinonit-31': 'עונה בינונית – יום 31',
  'ohr-zarua': 'אור זרוע',
  kavua: 'וסת קבוע',
};

const d = (x: ISODate) => formatDate(x, 'both', { year: false });
const onahOf = (o: Onah) => ONAH_LABEL[o];

interface Ctx {
  loc: Location;
  settings: HalachaSettings;
  entries: VesetEntry[];
}

function push(
  ctx: Ctx,
  kind: EntryKind,
  hdate: ISODate,
  onah: Onah,
  e: Omit<VesetEntry['explanation'], 'minhag' | 'source'>,
) {
  const rule = RULES[ENTRY_RULE[kind]]!;
  ctx.entries.push({
    kind,
    ruleId: rule.id,
    label: LABELS[kind],
    hdate,
    onah,
    window: onahWindow(hdate, onah, ctx.loc),
    explanation: { ...e, minhag: MINHAG_LABELS[ctx.settings.minhag], source: rule.source },
  });
}

/** Haflagot that are longer than the current one and were never uprooted. */
export function unuprootedHaflagot(intervals: readonly number[]): number[] {
  const current = intervals.at(-1);
  if (current === undefined) return [];
  const out = new Set<number>();
  for (let i = 0; i < intervals.length - 1; i++) {
    const h = intervals[i]!;
    if (h <= current) continue;
    if (intervals.slice(i + 1).every((later) => later < h)) out.add(h);
  }
  return [...out].sort((a, b) => a - b);
}

export function computeVestot(
  sightings: readonly SightingInput[],
  settings: HalachaSettings,
  loc: Location,
  today: ISODate,
): VestotResult {
  const issues: Issue[] = [];
  if (!allApproved()) {
    issues.push({
      kind: 'unapproved-rules',
      severity: 'warning',
      message:
        'החישובים ההלכתיים טרם נבדקו ואושרו על ידי גורם הלכתי מוסמך. הם מוצגים כטיוטה לבדיקה בלבד, ואין להסתמך עליהם.',
    });
  }
  const resolved: ResolvedSighting[] = [...sightings]
    .map((s) => resolveSighting(s, loc))
    .sort((a, b) =>
      a.hdate === b.hdate ? (a.onah === 'night' ? -1 : 1) : a.hdate < b.hdate ? -1 : 1,
    );

  for (const r of resolved) {
    if (!r.computable)
      issues.push({
        kind: 'complex-case',
        severity: 'warning',
        message: `${d(r.civilDate)}: ${COMPLEX_CASE_MESSAGE}`,
        sightingId: r.id,
      });
    else if (!r.onah)
      issues.push({
        kind: 'unknown-onah',
        severity: 'warning',
        message: `${d(r.civilDate)}: לא ידוע אם הראייה הייתה ביום או בלילה. יש להשלים שעה או עונה כדי לחשב.`,
        sightingId: r.id,
      });
    else if (r.nearTwilight)
      issues.push({
        kind: 'near-twilight',
        severity: 'warning',
        message: `${d(r.civilDate)}: הראייה הייתה סמוך לזריחה או לשקיעה. יש לברר עם רב לאיזו עונה היא שייכת.`,
        sightingId: r.id,
      });
  }

  const usable = resolved.filter((r) => r.computable && r.onah);
  const ctx: Ctx = { loc, settings, entries: [] };
  const last = usable.at(-1);
  if (!last) {
    issues.push({
      kind: 'no-sightings',
      severity: 'info',
      message: 'אין עדיין ראייה מתועדת שאפשר לחשב ממנה.',
    });
    return { resolved, entries: [], prishot: [], upcoming: [], patterns: [], issues };
  }
  const lo = last.onah!;
  const intervals = usable.slice(1).map((x, i) => diffDays(usable[i]!.hdate, x.hdate) + 1);
  const fixed = settings.fixedVeset ?? null;

  // ---- fixed veset (personal ruling) ----
  let matchesFixed = false;
  if (fixed) {
    if (fixed.type === 'chodesh') {
      matchesFixed = toHebrewDate(last.hdate).day === fixed.value && lo === fixed.onah;
      // the fixed day-of-month: later this month if still ahead, otherwise next month
      const thisStart = startOfHebrewMonth(last.hdate);
      const nextStart = nextHebrewMonthStart(last.hdate);
      const inThis =
        fixed.value <= hebrewMonthLength(thisStart) ? addDays(thisStart, fixed.value - 1) : null;
      const inNext =
        fixed.value <= hebrewMonthLength(nextStart) ? addDays(nextStart, fixed.value - 1) : null;
      const next =
        inThis && inThis > last.hdate
          ? { date: inThis, monthName: toHebrewDate(thisStart).month }
          : { date: inNext, monthName: toHebrewDate(nextStart).month };
      if (next.date)
        push(ctx, 'kavua', next.date, fixed.onah, {
          basis: [d(last.civilDate)],
          computation: `וסת קבוע ליום ${formatHebrew(next.date, { year: false }).split(' ב')[0]} בחודש, ${onahOf(fixed.onah)}.`,
          why: 'וסת קבוע שאושר על ידי רב.',
        });
      else
        issues.push({
          kind: 'chodesh-missing-day',
          severity: 'warning',
          message: `בחודש ${next.monthName} אין יום ${fixed.value}. יש לברר עם רב.`,
        });
    } else {
      matchesFixed = intervals.at(-1) === fixed.value && lo === fixed.onah;
      push(ctx, 'kavua', addDays(last.hdate, fixed.value - 1), fixed.onah, {
        basis: [d(last.civilDate)],
        interval: fixed.value,
        computation: `${fixed.value} ימים מהראייה האחרונה (כולל יום הראייה), ${onahOf(fixed.onah)}.`,
        why: 'וסת הפלגה קבוע שאושר על ידי רב.',
      });
    }
    if (!matchesFixed)
      issues.push({
        kind: 'deviates-from-fixed',
        severity: 'warning',
        message:
          'הראייה האחרונה לא הייתה בזמן הווסת הקבוע. חוששים גם לווסתות שאינם קבועים ממנה. מומלץ לברר עם רב.',
      });
  }

  // ---- non-fixed vestot from the last sighting ----
  if (!fixed || !matchesFixed) {
    const ch = sameHebrewDayMonthsLater(last.hdate, 1);
    if (ch.date) {
      push(ctx, 'chodesh', ch.date, lo, {
        basis: [d(last.civilDate)],
        computation: `${formatHebrew(last.hdate, { year: false })} ← ${formatHebrew(ch.date, { year: false })}: אותו יום בחודש העברי הבא, ${onahOf(lo)}.`,
        why: 'ראייה ביום מסוים בחודש מעוררת חשש שתחזור באותו יום בחודש הבא.',
      });
    } else {
      issues.push({
        kind: 'chodesh-missing-day',
        severity: 'warning',
        message: `הראייה הייתה ביום ל׳, ובחודש ${ch.monthName} אין יום ל׳. דין וסת החודש במקרה זה דורש בירור עם רב.`,
        sightingId: last.id,
      });
    }

    if (intervals.length) {
      const h = intervals.at(-1)!;
      const prev = usable.at(-2)!;
      push(ctx, 'haflagah', addDays(last.hdate, h - 1), lo, {
        basis: [d(prev.civilDate), d(last.civilDate)],
        interval: h,
        computation: `בין ${d(prev.hdate)} ל-${d(last.hdate)} יש ${h} ימים (כולל שני הימים). ${h} ימים מהראייה האחרונה: ${d(addDays(last.hdate, h - 1))}, ${onahOf(lo)}.`,
        why: 'ההפרש בין שתי הראיות האחרונות מעורר חשש שתחזור אחרי אותו מספר ימים.',
      });
      if (settings.haflagotNotUprooted) {
        for (const old of unuprootedHaflagot(intervals)) {
          push(ctx, 'haflagah-old', addDays(last.hdate, old - 1), lo, {
            basis: [d(last.civilDate)],
            interval: old,
            computation: `הפלגה קודמת של ${old} ימים שלא נעקרה, נספרת מהראייה האחרונה.`,
            why: 'לפי הוראת רב: הפלגה ארוכה שלא עבר עליה מועד בלי ראייה עדיין לא נעקרה.',
          });
        }
      }
    } else {
      issues.push({
        kind: 'single-sighting',
        severity: 'info',
        message: 'וסת ההפלגה יחושב אחרי שתי ראיות מתועדות לפחות.',
      });
    }

    if (!fixed) {
      const b30 = addDays(last.hdate, 29);
      push(ctx, 'beinonit', b30, lo, {
        basis: [d(last.civilDate)],
        computation: `יום הראייה הוא יום 1, ולכן היום ה-30 הוא ${d(b30)}, ${onahOf(lo)}.`,
        why: 'עונה בינונית היא הזמן שבו רוב הנשים רואות, ולכן חוששים לה כשאין וסת קבוע.',
      });
      if (settings.beinonitFullDay) {
        const other: Onah = lo === 'day' ? 'night' : 'day';
        push(ctx, 'beinonit-other-onah', b30, other, {
          basis: [d(last.civilDate)],
          computation: `גם ${onahOf(other)} של היום ה-30.`,
          why: 'חומרה לפרוש מעת לעת ביום ה-30, לפי המנהג שנבחר.',
        });
      }
      if (settings.beinonitDay31) {
        const b31 = addDays(last.hdate, 30);
        push(ctx, 'beinonit-31', b31, lo, {
          basis: [d(last.civilDate)],
          computation: `היום ה-31: ${d(b31)}, ${onahOf(lo)}.`,
          why: 'חומרה לחשוש גם ליום ה-31, לפי המנהג שנבחר.',
        });
      }
    }
  }

  if (settings.ohrZarua) {
    for (const e of ctx.entries.filter(
      (x) => x.kind !== 'ohr-zarua' && x.kind !== 'beinonit-other-onah',
    )) {
      const p = previousOnah(e.hdate, e.onah);
      push(ctx, 'ohr-zarua', p.hdate, p.onah, {
        basis: e.explanation.basis,
        computation: `העונה שלפני ${e.label} (${onahOf(e.onah)} של ${d(e.hdate)}).`,
        why: 'חומרת אור זרוע: פרישה גם בעונה הסמוכה שלפני עונת הווסת.',
      });
    }
  }

  // ---- group into separation onot ----
  const map = new Map<string, Prishah>();
  for (const e of ctx.entries) {
    const k = `${e.hdate}|${e.onah}`;
    const p = map.get(k) ?? { hdate: e.hdate, onah: e.onah, window: e.window, entries: [] };
    if (!p.entries.some((x) => x.kind === e.kind)) p.entries.push(e);
    map.set(k, p);
  }
  const prishot = [...map.values()].sort((a, b) =>
    a.hdate === b.hdate ? (a.onah === 'night' ? -1 : 1) : a.hdate < b.hdate ? -1 : 1,
  );
  const upcoming = prishot.filter((p) => p.window.to.date >= today);

  return {
    resolved,
    entries: ctx.entries,
    prishot,
    upcoming,
    patterns: detectPatterns(usable),
    issues,
  };
}
