// חישובי מחזור משותפים לשרת ולדפדפן.
// כל התאריכים הם מחרוזות 'YYYY-MM-DD' ומחושבים כמספרי ימים ב-UTC,
// כך ששעון קיץ/חורף לא משפיע על ספירת הימים.

const DAY_MS = 86400000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** כמה מחזורים מלאים (מרווחים) נדרשים כדי להציג תחזית */
export const MIN_INTERVALS_FOR_PREDICTION = 2;
/** מספר המרווחים האחרונים שנכנסים לממוצע */
export const RECENT_INTERVALS = 6;
/** מרווח ארוך מזה נחשב כנראה רישום חסר, ולא נכנס לממוצע */
export const MAX_PLAUSIBLE_INTERVAL = 90;
/** מחזור בלי תאריך סיום ייחשב "פעיל" עד כמה ימים מתחילתו */
export const OPEN_PERIOD_DAYS = 8;
/** משך דימום מרבי שמתקבל ברישום */
export const MAX_BLEED_DAYS = 15;

export function isValidDate(str) {
  if (typeof str !== 'string') return false;
  const m = ISO_RE.exec(str);
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (y < 1900 || y > 2200 || mo < 1 || mo > 12 || d < 1) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function toDay(str) {
  const m = ISO_RE.exec(str);
  return Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY_MS);
}

export function fromDay(n) {
  const d = new Date(n * DAY_MS);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const da = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function addDays(str, n) {
  return fromDay(toDay(str) + n);
}

/** b פחות a בימים */
export function diffDays(a, b) {
  return toDay(b) - toDay(a);
}

/** התאריך המקומי של היום, לפי שעון המכשיר */
export function localToday(now = new Date()) {
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

/** משך הדימום כולל יום ההתחלה ויום הסיום */
export function bleedDays(cycle) {
  if (!cycle || !cycle.start || !cycle.end) return null;
  return diffDays(cycle.start, cycle.end) + 1;
}

export function sortByStart(cycles, dir = 'asc') {
  const out = [...cycles].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  return dir === 'desc' ? out.reverse() : out;
}

function mean(arr) {
  return arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
}

function round1(x) {
  return x == null ? null : Math.round(x * 10) / 10;
}

/**
 * ניתוח מלא של היסטוריית מחזורים של בת אחת.
 * מחזיר רשימה ממוינת עם מספור, אורכים, ממוצעים, סטטוס ותחזית.
 */
export function analyze(cycles, today) {
  const sorted = sortByStart(cycles || []);
  const rows = sorted.map((c, i) => {
    const next = sorted[i + 1];
    const prev = sorted[i - 1];
    return {
      ...c,
      number: i + 1,
      bleed: bleedDays(c),
      // מספר הימים מתחילת המחזור הקודם לתחילת המחזור הזה
      sincePrev: prev ? diffDays(prev.start, c.start) : null,
      // אורך המחזור: מתחילתו ועד תחילת המחזור הבא
      length: next ? diffDays(c.start, next.start) : null,
    };
  });

  const allIntervals = rows.filter((r) => r.length != null).map((r) => r.length);
  const valid = allIntervals.filter((x) => x <= MAX_PLAUSIBLE_INTERVAL);
  const recent = valid.slice(-RECENT_INTERVALS);
  const avgCycle = mean(recent);
  const bleeds = rows.filter((r) => r.bleed != null).map((r) => r.bleed);
  const avgBleed = mean(bleeds.slice(-RECENT_INTERVALS));

  const last = rows[rows.length - 1] || null;
  const result = {
    rows,
    count: rows.length,
    last,
    intervals: allIntervals,
    avgCycle: round1(avgCycle),
    avgBleed: round1(avgBleed),
    minCycle: recent.length ? Math.min(...recent) : null,
    maxCycle: recent.length ? Math.max(...recent) : null,
    status: 'none',
    openEnded: false,
    cycleDay: null,
    daysSinceStart: null,
    prediction: null,
    enoughData: recent.length >= MIN_INTERVALS_FOR_PREDICTION,
    neededForPrediction: Math.max(0, MIN_INTERVALS_FOR_PREDICTION - recent.length),
  };

  if (!last || !today) return result;

  const since = diffDays(last.start, today);
  if (since >= 0) {
    result.daysSinceStart = since;
    result.cycleDay = since + 1;
  }
  if (since < 0) {
    result.status = 'between';
  } else if (last.end) {
    result.status = toDay(today) <= toDay(last.end) ? 'period' : 'between';
  } else {
    result.openEnded = true;
    result.status = since < OPEN_PERIOD_DAYS ? 'period' : 'between';
  }

  if (result.enoughData) {
    const len = Math.round(avgCycle);
    const date = addDays(last.start, len);
    const daysUntil = diffDays(today, date);
    const spread = Math.min(5, Math.max(2, Math.ceil((result.maxCycle - result.minCycle) / 2)));
    result.prediction = {
      date,
      from: addDays(date, -spread),
      to: addDays(date, spread),
      daysUntil,
      overdue: daysUntil < 0 ? -daysUntil : 0,
      expectedBleed: Math.max(1, Math.round(avgBleed || 5)),
      basedOn: recent.length,
    };
  }
  return result;
}

/** הטווח שבו מחזור "תופס" ימים, לבדיקת חפיפות */
function spanOf(c) {
  const s = toDay(c.start);
  const e = c.end ? toDay(c.end) : s;
  return [s, e];
}

/**
 * בדיקת תקינות לרשומת מחזור לפני שמירה.
 * existing: המחזורים הקיימים של אותה בת בלבד. editingId: מזהה הרשומה הנערכת.
 * מחזיר מערך הודעות שגיאה בעברית (ריק = תקין).
 */
export function validateCycle(input, existing, today, editingId = null) {
  const errors = [];
  const start = input && input.start;
  const end = input && input.end ? input.end : null;
  const notes = input && input.notes != null ? String(input.notes) : '';

  if (!isValidDate(start)) {
    errors.push('יש להזין תאריך התחלה תקין.');
    return errors;
  }
  if (end != null && !isValidDate(end)) {
    errors.push('תאריך הסיום אינו תקין.');
    return errors;
  }
  if (today && toDay(start) > toDay(today) + 1) {
    errors.push('תאריך ההתחלה לא יכול להיות בעתיד.');
  }
  if (end) {
    if (toDay(end) < toDay(start)) errors.push('תאריך הסיום לא יכול להיות לפני תאריך ההתחלה.');
    else if (diffDays(start, end) + 1 > MAX_BLEED_DAYS)
      errors.push(`משך הדימום ארוך מ-${MAX_BLEED_DAYS} ימים. כדאי לבדוק את התאריכים.`);
    if (today && toDay(end) > toDay(today) + 1) errors.push('תאריך הסיום לא יכול להיות בעתיד.');
  }
  if (notes.length > 1000) errors.push('ההערות ארוכות מדי (עד 1000 תווים).');
  if (errors.length) return errors;

  const others = (existing || []).filter((c) => String(c.id) !== String(editingId));
  const dup = others.find((c) => c.start === start);
  if (dup) {
    errors.push('כבר קיים מחזור שמתחיל בתאריך הזה.');
    return errors;
  }
  const [ns, ne] = spanOf({ start, end });
  const clash = others.find((c) => {
    const [s, e] = spanOf(c);
    return ns <= e && s <= ne;
  });
  if (clash) {
    const range = clash.end ? `${formatDate(clash.start)}–${formatDate(clash.end)}` : formatDate(clash.start);
    errors.push(`התאריכים חופפים למחזור קיים (${range}).`);
  }
  return errors;
}

export function formatDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}.${m}.${y}`;
}

export function ageFrom(birthDate, today) {
  if (!isValidDate(birthDate) || !today) return null;
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age--;
  return age >= 0 ? age : null;
}
