/* TAHARA – calculation engine.
 * Pure functions only (no DOM). Dates are plain 'YYYY-MM-DD' strings
 * interpreted as calendar days in Asia/Jerusalem, so arithmetic never
 * drifts across daylight-saving changes.
 *
 * Three separate domains, never mixed:
 *   medical  – periods, bleeding, symptoms
 *   halacha  – hefsek tahara, shiva nekiim, tevila, onot / haflagah
 *   predict  – expected period, ovulation, fertile window
 */
(function (root) {
  'use strict';

  const TZ = 'Asia/Jerusalem';
  const DAY_MS = 86400000;

  /* ---------------- basic date helpers ---------------- */
  function dn(s) { const [y, m, d] = s.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / DAY_MS); }
  function ds(n) { return new Date(n * DAY_MS).toISOString().slice(0, 10); }
  function addDays(s, k) { return ds(dn(s) + k); }
  function diffDays(a, b) { return dn(b) - dn(a); }
  function isDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(dn(s)); }
  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  function weekday(s) { return new Date(dn(s) * DAY_MS).getUTCDay(); }

  const jerFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  function nowJerusalem(date) {
    const p = {}; jerFmt.formatToParts(date || new Date()).forEach(x => { p[x.type] = x.value; });
    return { date: `${p.year}-${p.month}-${p.day}`, minutes: (+p.hour % 24) * 60 + (+p.minute) };
  }
  function today() { return nowJerusalem().date; }

  /** UTC offset of Jerusalem (in minutes) on a given calendar day. */
  const offCache = new Map();
  function tzOffsetMin(s) {
    if (offCache.has(s)) return offCache.get(s);
    const d = new Date(dn(s) * DAY_MS + 12 * 3600000);
    let off = 120;
    try {
      const part = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' }).formatToParts(d).find(x => x.type === 'timeZoneName');
      const m = part && part.value.match(/GMT([+-])(\d+)(?::(\d+))?/);
      if (m) off = (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + (+m[3] || 0));
    } catch (e) { /* fall back to +2 */ }
    offCache.set(s, off);
    return off;
  }

  /* ---------------- Gregorian display ---------------- */
  const GREG_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const WEEKDAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  function gregStr(s, opts) {
    if (!isDate(s)) return '';
    const [y, m, d] = s.split('-').map(Number);
    let out = `${d} ב${GREG_MONTHS[m - 1]}`;
    if (!opts || opts.year !== false) out += ` ${y}`;
    if (opts && opts.weekday) out = `יום ${WEEKDAYS[weekday(s)]}, ` + out;
    return out;
  }
  function gregShort(s) { if (!isDate(s)) return ''; const [y, m, d] = s.split('-'); return `${+d}.${+m}.${y.slice(2)}`; }

  /* ---------------- Hebrew calendar ---------------- */
  const hebCache = new Map();
  let hebFmt = null;
  try { hebFmt = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { hebFmt = null; }
  function heb(s) {
    if (hebCache.has(s)) return hebCache.get(s);
    let r = { d: 0, m: '', y: 0 };
    if (hebFmt) {
      const p = {}; hebFmt.formatToParts(new Date(dn(s) * DAY_MS + 12 * 3600000)).forEach(x => { p[x.type] = x.value; });
      r = { d: parseInt(p.day, 10), m: p.month, y: parseInt(p.year, 10) };
    }
    hebCache.set(s, r);
    return r;
  }
  const GEM = [[400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'], [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']];
  function gematria(n) {
    n = n % 1000; let s = '';
    while (n > 0) {
      if (n === 15) { s += 'טו'; break; }
      if (n === 16) { s += 'טז'; break; }
      for (const [v, c] of GEM) { if (n >= v) { s += c; n -= v; break; } }
    }
    if (!s) return '';
    return s.length === 1 ? s + '׳' : s.slice(0, -1) + '״' + s.slice(-1);
  }
  function hebStr(s, opts) {
    if (!isDate(s)) return '';
    const h = heb(s); if (!h.d) return '';
    let out = `${gematria(h.d)} ב${h.m}`;
    if (!opts || opts.year !== false) out += ` ${gematria(h.y)}`;
    return out;
  }
  function hebDay(s) { const h = heb(s); return h.d ? gematria(h.d) : ''; }
  function hebMonthYear(s) { const h = heb(s); return h.d ? `${h.m} ${gematria(h.y)}` : ''; }

  /** Same Hebrew day-of-month in the following Hebrew month (veset hachodesh).
   *  Returns {date} or {date:null, missing:true} when that day doesn't exist (e.g. 30th). */
  function sameHebDayNextMonth(s) {
    const h = heb(s); if (!h.d) return { date: null, missing: true };
    let k = 1;
    while (k < 40) { const x = heb(addDays(s, k)); if (x.m !== h.m || x.y !== h.y) break; k++; }
    const firstNext = addDays(s, k); const nm = heb(firstNext);
    for (let j = 0; j < 31; j++) {
      const t = addDays(firstNext, j); const x = heb(t);
      if (x.m !== nm.m || x.y !== nm.y) break;
      if (x.d === h.d) return { date: t };
    }
    return { date: null, missing: true, monthName: nm.m };
  }

  /* ---------------- sun times (NOAA approximation) ---------------- */
  function sunUTCHours(s, lat, lng, rising) {
    const rad = Math.PI / 180, zenith = 90.833;
    const [y] = s.split('-').map(Number);
    const N = dn(s) - dn(`${y}-01-01`) + 1;
    const lngHour = lng / 15;
    const t = N + ((rising ? 6 : 18) - lngHour) / 24;
    const M = 0.9856 * t - 3.289;
    let L = M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634;
    L = ((L % 360) + 360) % 360;
    let RA = Math.atan(0.91764 * Math.tan(L * rad)) / rad;
    RA = ((RA % 360) + 360) % 360;
    RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90;
    RA /= 15;
    const sinDec = 0.39782 * Math.sin(L * rad);
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (Math.cos(zenith * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad));
    if (cosH > 1 || cosH < -1) return null;
    let H = rising ? 360 - Math.acos(cosH) / rad : Math.acos(cosH) / rad;
    H /= 15;
    const T = H + RA - 0.06571 * t - 6.622;
    return (((T - lngHour) % 24) + 24) % 24;
  }
  /** Local (Jerusalem) sunrise/sunset in minutes after midnight. */
  function sunTimes(s, lat, lng) {
    const off = tzOffsetMin(s);
    const r = sunUTCHours(s, lat, lng, true), st = sunUTCHours(s, lat, lng, false);
    const toLocal = h => h == null ? null : Math.round((h * 60 + off + 1440) % 1440);
    return { sunrise: toLocal(r) ?? 360, sunset: toLocal(st) ?? 1080 };
  }
  function hm(min) { if (min == null) return ''; min = ((Math.round(min) % 1440) + 1440) % 1440; return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; }
  function parseHM(t) { if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; }

  /* ---------------- defaults ---------------- */
  const CITIES = {
    jerusalem: { name: 'ירושלים', lat: 31.778, lon: 35.235 },
    telaviv: { name: 'תל אביב', lat: 32.080, lon: 34.780 },
    bneibrak: { name: 'בני ברק', lat: 32.084, lon: 34.833 },
    haifa: { name: 'חיפה', lat: 32.794, lon: 34.990 },
    beersheva: { name: 'באר שבע', lat: 31.252, lon: 34.791 },
    modiin: { name: 'מודיעין עילית', lat: 31.932, lon: 35.042 },
    beitshemesh: { name: 'בית שמש', lat: 31.747, lon: 34.989 },
    tzfat: { name: 'צפת', lat: 32.965, lon: 35.496 },
    ashdod: { name: 'אשדוד', lat: 31.804, lon: 34.655 },
    eilat: { name: 'אילת', lat: 29.558, lon: 34.952 }
  };

  function defaultSettings() {
    return {
      cycleLength: 28, bleedDays: 5, luteal: 14, avgWindow: 6, fertileBefore: 5, fertileAfter: 1, useLH: true,
      minHefsekDays: 5,
      city: 'jerusalem', lat: CITIES.jerusalem.lat, lon: CITIES.jerusalem.lon,
      onot: { haflagah: true, chodesh: true, beinonit: true, beinonit31: false, beinonitFull: false, ohrZarua: false, oldHaflagot: false },
      dateMode: 'both', theme: 'auto', weekStart: 0,
      checklist: ['מקלחת', 'חפיפת שיער', 'ניקוי ציפורניים', 'הסרת לק', 'בדיקת הגוף'],
      reminderTime: '08:00',
      reminders: {
        period: { on: true, before: 2 }, hefsek: { on: true, before: 0 }, shiva: { on: true, before: 0 },
        tevila: { on: true, before: 0 }, fertile: { on: false, before: 1 }, ovulation: { on: false, before: 0 },
        lh: { on: false, before: 0 }, onot: { on: true, before: 1 }
      },
      autoLockMin: 3,
      rabbiNote: ''
    };
  }
  function mergeSettings(s) {
    const d = defaultSettings();
    if (!s) return d;
    const out = Object.assign({}, d, s);
    out.onot = Object.assign({}, d.onot, s.onot || {});
    out.reminders = Object.assign({}, d.reminders);
    for (const k of Object.keys(d.reminders)) out.reminders[k] = Object.assign({}, d.reminders[k], (s.reminders || {})[k] || {});
    if (!Array.isArray(out.checklist)) out.checklist = d.checklist.slice();
    return out;
  }

  /* ---------------- medical ---------------- */
  function sortedPeriods(state) { return (state.periods || []).filter(p => isDate(p.start)).slice().sort((a, b) => cmp(a.start, b.start)); }
  function bleedLength(p) { return isDate(p.end) && p.end >= p.start ? diffDays(p.start, p.end) + 1 : (p.bleedDays ? +p.bleedDays : null); }

  /** Cycle lengths between consecutive starts (only plausible values 15–60 days). */
  function cycles(state) {
    const ps = sortedPeriods(state); const out = [];
    for (let i = 1; i < ps.length; i++) {
      const len = diffDays(ps[i - 1].start, ps[i].start);
      out.push({ from: ps[i - 1], to: ps[i], start: ps[i - 1].start, length: len, valid: len >= 15 && len <= 60 });
    }
    return out;
  }
  function avgCycle(state) {
    const s = state.settings; const cs = cycles(state).filter(c => c.valid).slice(-Math.max(1, s.avgWindow || 6));
    if (!cs.length) return { value: +s.cycleLength || 28, fromData: false, n: 0 };
    return { value: cs.reduce((a, c) => a + c.length, 0) / cs.length, fromData: true, n: cs.length };
  }
  function avgBleed(state) {
    const vals = sortedPeriods(state).map(bleedLength).filter(v => v && v > 0 && v < 15).slice(-(state.settings.avgWindow || 6));
    if (!vals.length) return { value: +state.settings.bleedDays || 5, fromData: false, n: 0 };
    return { value: vals.reduce((a, b) => a + b, 0) / vals.length, fromData: true, n: vals.length };
  }

  /* ---------------- predictions ---------------- */
  function predictions(state, refDate) {
    const t = refDate || today();
    const s = state.settings; const ps = sortedPeriods(state);
    if (!ps.length) return null;
    const last = ps[ps.length - 1];
    const avg = avgCycle(state); const L = Math.round(avg.value);
    const luteal = +s.luteal || 14;
    let next = addDays(last.start, L);
    // if the expected date already passed with no new entry, roll forward and flag lateness
    const late = diffDays(next, t) > 0 ? diffDays(next, t) : 0;
    const ovEst = addDays(next, -luteal);
    let ov = ovEst, ovSource = 'calendar';
    if (s.useLH) {
      const lh = (state.ovLogs || []).filter(l => l.lh === 'pos' && l.date >= last.start && l.date < next).sort((a, b) => cmp(a.date, b.date))[0];
      if (lh) { ov = addDays(lh.date, 1); ovSource = 'lh'; }
    }
    const fb = +s.fertileBefore || 5, fa = s.fertileAfter == null ? 1 : +s.fertileAfter;
    const future = [];
    for (let k = 1; k <= 4; k++) {
      const st = addDays(last.start, L * k);
      const o = k === 1 ? ov : addDays(st, -luteal);
      future.push({ start: st, ovulation: o, fertileStart: addDays(o, -fb), fertileEnd: addDays(o, fa), high: [addDays(o, -2), o] });
    }
    return {
      lastStart: last.start, cycleDay: diffDays(last.start, t) + 1, avgCycle: avg, cycleLen: L,
      nextPeriod: next, daysToNext: diffDays(t, next), late,
      ovulation: ov, ovSource, daysToOv: diffDays(t, ov),
      fertileStart: addDays(ov, -fb), fertileEnd: addDays(ov, fa),
      future
    };
  }

  /* ---------------- halacha: onah of a veset ---------------- */
  /** Determine the halachic date & onah of a period start.
   *  onahMode: 'auto' (by time vs. sunrise/sunset), 'day', 'nightBefore' (before dawn), 'nightAfter' (after sunset), 'unknown'. */
  function vesetOnah(p, settings) {
    const mode = p.onahMode || 'auto';
    const t = parseHM(p.time);
    if (mode === 'day') return { hdate: p.start, onah: 'day', known: true };
    if (mode === 'nightBefore') return { hdate: p.start, onah: 'night', known: true };
    if (mode === 'nightAfter') return { hdate: addDays(p.start, 1), onah: 'night', known: true };
    if (mode === 'auto' && t != null) {
      const sun = sunTimes(p.start, settings.lat, settings.lon);
      if (t < sun.sunrise) return { hdate: p.start, onah: 'night', known: true, sun };
      if (t >= sun.sunset) return { hdate: addDays(p.start, 1), onah: 'night', known: true, sun };
      return { hdate: p.start, onah: 'day', known: true, sun };
    }
    return { hdate: p.start, onah: 'day', known: false };
  }

  /** Civil description of an onah window. Night onah of hdate = evening of hdate-1 → morning of hdate. */
  function onahWindow(hdate, onah, settings) {
    if (onah === 'night') {
      const eve = addDays(hdate, -1);
      const a = sunTimes(eve, settings.lat, settings.lon), b = sunTimes(hdate, settings.lat, settings.lon);
      return { civil: eve, from: a.sunset, to: b.sunrise, text: `ליל ${WEEKDAYS[weekday(eve)]}–${WEEKDAYS[weekday(hdate)]}, מהשקיעה (~${hm(a.sunset)}) עד הזריחה (~${hm(b.sunrise)})` };
    }
    if (onah === 'full') {
      const eve = addDays(hdate, -1);
      const a = sunTimes(eve, settings.lat, settings.lon), b = sunTimes(hdate, settings.lat, settings.lon);
      return { civil: eve, from: a.sunset, to: b.sunset, text: `מעת לעת: מהשקיעה בליל ${WEEKDAYS[weekday(eve)]} (~${hm(a.sunset)}) עד השקיעה ביום ${WEEKDAYS[weekday(hdate)]} (~${hm(b.sunset)})` };
    }
    const sn = sunTimes(hdate, settings.lat, settings.lon);
    return { civil: hdate, from: sn.sunrise, to: sn.sunset, text: `יום ${WEEKDAYS[weekday(hdate)]}, מהזריחה (~${hm(sn.sunrise)}) עד השקיעה (~${hm(sn.sunset)})` };
  }

  /** Haflagah intervals (inclusive count, between halachic dates of consecutive vesatot). */
  function haflagot(state) {
    const ps = sortedPeriods(state); const out = [];
    for (let i = 1; i < ps.length; i++) {
      const a = vesetOnah(ps[i - 1], state.settings), b = vesetOnah(ps[i], state.settings);
      out.push({ from: ps[i - 1], to: ps[i], fromH: a.hdate, toH: b.hdate, length: diffDays(a.hdate, b.hdate) + 1, onah: b.onah, known: a.known && b.known });
    }
    return out;
  }

  /** Onot that derive from period index i (technical calculation per user settings). */
  function onotFor(state, idx) {
    const s = state.settings; const o = s.onot; const ps = sortedPeriods(state);
    const p = ps[idx]; if (!p) return [];
    const v = vesetOnah(p, s); const res = [];
    const hfl = haflagot(state);
    const push = (kind, label, hdate, onah, extra) => { res.push(Object.assign({ kind, label, hdate, onah, base: p.start, baseH: v.hdate, known: v.known }, extra || {})); };

    if (o.chodesh) {
      const r = sameHebDayNextMonth(v.hdate);
      if (r.date) push('chodesh', 'וסת החודש', r.date, v.onah, { info: `${hebStr(v.hdate, { year: false })} → ${hebStr(r.date, { year: false })}` });
      else push('chodesh', 'וסת החודש', null, v.onah, { missing: true, info: `יום ${hebDay(v.hdate)} אינו קיים בחודש ${r.monthName || 'הבא'} – יש לברר את הדין עם רב` });
    }
    if (o.haflagah && idx > 0) {
      const h = hfl[idx - 1];
      push('haflagah', `הפלגה (${h.length} יום)`, addDays(v.hdate, h.length - 1), v.onah, { interval: h.length });
      if (o.oldHaflagot) {
        // earlier intervals not yet uprooted: every later interval was shorter than it
        for (let i = idx - 2; i >= 0; i--) {
          const hi = hfl[i];
          let uprooted = false;
          for (let j = i + 1; j <= idx - 1; j++) if (hfl[j].length > hi.length) { uprooted = true; break; }
          if (!uprooted && hi.length > h.length && !res.some(r => r.interval === hi.length)) {
            push('haflagahOld', `הפלגה קודמת שלא נעקרה (${hi.length} יום)`, addDays(v.hdate, hi.length - 1), v.onah, { interval: hi.length });
          }
        }
      }
    }
    if (o.beinonit) {
      push('beinonit', 'עונה בינונית (יום 30)', addDays(v.hdate, 29), o.beinonitFull ? 'full' : v.onah);
      if (o.beinonit31) push('beinonit31', 'יום 31', addDays(v.hdate, 30), o.beinonitFull ? 'full' : v.onah);
    }
    if (o.ohrZarua) {
      const base = res.filter(r => r.hdate && r.onah !== 'full').slice();
      for (const r of base) {
        const prev = r.onah === 'night' ? { hdate: addDays(r.hdate, -1), onah: 'day' } : { hdate: r.hdate, onah: 'night' };
        push('ohrZarua', `אור זרוע – לפני ${r.label}`, prev.hdate, prev.onah, { parent: r.kind });
      }
    }
    res.forEach(r => { if (r.hdate) r.window = onahWindow(r.hdate, r.onah, s); });
    res.sort((a, b) => cmp(a.hdate || '9999', b.hdate || '9999'));
    return res;
  }
  function currentOnot(state) { const n = sortedPeriods(state).length; return n ? onotFor(state, n - 1) : []; }

  /** Repeating patterns – flags only, never rulings. */
  function patterns(state) {
    const out = []; const h = haflagot(state);
    if (h.length >= 3) {
      const l = h.slice(-3).map(x => x.length);
      if (l[0] === l[1] && l[1] === l[2]) out.push(`שלוש הפלגות רצופות זהות (${l[0]} יום). ייתכן שמדובר בדפוס קבוע – יש להתייעץ עם רב.`);
    }
    const ps = sortedPeriods(state);
    if (ps.length >= 3) {
      const days = ps.slice(-3).map(p => heb(vesetOnah(p, state.settings).hdate).d);
      if (days[0] && days[0] === days[1] && days[1] === days[2]) out.push(`שלוש וסתות רצופות באותו תאריך עברי (${gematria(days[0])} בחודש). יש להתייעץ עם רב.`);
    }
    const counts = {}; h.forEach(x => { counts[x.length] = (counts[x.length] || 0) + 1; });
    const rep = Object.entries(counts).filter(([, c]) => c >= 2).map(([k]) => +k).sort((a, b) => a - b);
    if (rep.length) out.push(`אורכי הפלגה שחזרו יותר מפעם אחת: ${rep.join(', ')} יום.`);
    return out;
  }

  /* ---------------- halacha: tahara cycle ---------------- */
  function taharaStatus(state, p, refDate) {
    const t = refDate || today(); const s = state.settings;
    if (!p) return null;
    const th = p.tahara || {};
    const earliest = addDays(p.start, (+s.minHefsekDays || 5) - 1);
    const hef = th.hefsek && isDate(th.hefsek.date) ? th.hefsek : null;
    const res = { earliestHefsek: earliest, hefsek: hef, stage: 'waiting' };
    if (!hef) { res.stage = 'waiting'; return res; }
    res.day1 = addDays(hef.date, 1); res.day7 = addDays(hef.date, 7);
    const tv = th.tevila || {};
    res.tevilaPlanned = isDate(tv.override) ? tv.override : res.day7; // civil date of the evening
    res.tevilaActual = isDate(tv.actual) ? tv.actual : null;
    res.tevilaDone = !!tv.done;
    const k = diffDays(hef.date, t);
    res.dayIndex = k; // 1..7 during the count
    const days = th.days || {};
    res.completed = [1, 2, 3, 4, 5, 6, 7].filter(i => days[i] && days[i].done).length;
    if (res.tevilaDone) res.stage = 'done';
    else if (k <= 0) res.stage = 'hefsek';
    else if (k <= 7) res.stage = 'shiva';
    else res.stage = 'tevila';
    res.remaining = Math.max(0, 7 - Math.max(0, k));
    return res;
  }

  /* ---------------- calendar events ---------------- */
  const PRIORITY = { hefsek: 8, period: 7, tevila: 5, shiva: 4, waiting: 3, predicted: 2, fertile: 1 };
  function buildEvents(state, from, to, refDate) {
    const t = refDate || today(); const s = state.settings;
    const map = new Map();
    const get = d => { if (!map.has(d)) map.set(d, { bg: null, marks: new Set(), items: [] }); return map.get(d); };
    const inR = d => d >= from && d <= to;
    const setBg = (d, k) => { const e = get(d); if (!e.bg || PRIORITY[k] > PRIORITY[e.bg]) e.bg = k; };
    const add = (d, cls, label, domain) => { if (!inR(d)) return; get(d).items.push({ cls, label, domain }); };
    const ps = sortedPeriods(state); const ab = Math.round(avgBleed(state).value);

    ps.forEach((p, i) => {
      const isLast = i === ps.length - 1;
      let end = isDate(p.end) && p.end >= p.start ? p.end : addDays(p.start, (p.bleedDays ? +p.bleedDays : ab) - 1);
      const estimated = !(isDate(p.end) && p.end >= p.start) && !p.bleedDays;
      const th = p.tahara || {}; const hef = th.hefsek && isDate(th.hefsek.date) ? th.hefsek.date : null;
      const next = ps[i + 1];
      if (isLast && estimated && end > t) end = t < p.start ? p.start : t;
      if (estimated && hef && end >= hef) end = addDays(hef, -1);
      if (next && end >= next.start) end = addDays(next.start, -1);
      if (end < p.start) end = p.start;
      for (let d = p.start, n = 1; d <= end; d = addDays(d, 1), n++) {
        if (!inR(d)) continue;
        setBg(d, 'period');
        add(d, 'period', n === 1 ? 'תחילת מחזור' + (p.time ? ` (${p.time})` : '') : `יום דימום ${n}${estimated ? ' (משוער)' : ''}`, 'medical');
      }
      const waitEnd = hef ? addDays(hef, -1) : (isLast ? addDays(p.start, (+s.minHefsekDays || 5) - 2) : null);
      if (waitEnd) for (let d = addDays(end, 1); d <= waitEnd && (!next || d < next.start); d = addDays(d, 1)) { if (inR(d)) { setBg(d, 'waiting'); add(d, 'waiting', 'ימי המתנה', 'halacha'); } }
      if (hef) {
        if (inR(hef)) { setBg(hef, 'hefsek'); add(hef, 'hefsek', 'הפסק טהרה' + (th.hefsek.time ? ` (${th.hefsek.time})` : ''), 'halacha'); }
        for (let k = 1; k <= 7; k++) {
          const d = addDays(hef, k); if (!inR(d)) continue;
          if (next && d >= next.start) break;
          setBg(d, 'shiva');
          const done = th.days && th.days[k] && th.days[k].done;
          add(d, 'shiva', `שבעה נקיים – יום ${k}${done ? ' ✓' : ''}`, 'halacha');
        }
        const tv = th.tevila || {};
        const tvDate = isDate(tv.actual) && tv.done ? tv.actual : (isDate(tv.override) ? tv.override : addDays(hef, 7));
        if (inR(tvDate)) { setBg(tvDate, 'tevila'); get(tvDate).marks.add('tevila'); add(tvDate, 'tevila', tv.done ? 'טבילה (סומנה כבוצעה)' : 'טבילה מתוכננת – בערב', 'halacha'); }
      }
      // onot derived from this veset (until the next one)
      onotFor(state, i).forEach(o => {
        if (!o.hdate || !o.window) return;
        if (next && o.hdate > vesetOnah(next, s).hdate) return;
        const d = o.window.civil; if (!inR(d)) return;
        get(d).marks.add('onah');
        add(d, 'onah', `${o.label} – ${o.onah === 'night' ? 'עונת לילה' : o.onah === 'full' ? 'מעת לעת' : 'עונת יום'}`, 'halacha');
        if (o.onah === 'full' || o.onah === 'night') { const d2 = o.hdate; if (d2 !== d && inR(d2)) { get(d2).marks.add('onah'); add(d2, 'onah', `${o.label} – המשך העונה עד הזריחה/השקיעה`, 'halacha'); } }
      });
    });

    const pr = predictions(state, t);
    if (pr) {
      pr.future.forEach((f, k) => {
        for (let j = 0; j < ab; j++) { const d = addDays(f.start, j); if (inR(d) && d > (ps[ps.length - 1].start)) { setBg(d, 'predicted'); add(d, 'predicted', j === 0 ? 'מחזור צפוי (הערכה)' : 'מחזור צפוי', 'predict'); } }
        if (k === 0 || k === 1) {
          for (let d = f.fertileStart; d <= f.fertileEnd; d = addDays(d, 1)) { if (inR(d) && d >= pr.lastStart) { setBg(d, 'fertile'); add(d, 'fertile', 'חלון פוריות משוער', 'predict'); } }
          if (inR(f.ovulation) && f.ovulation >= pr.lastStart) { get(f.ovulation).marks.add('ovulation'); add(f.ovulation, 'ovulation', k === 0 && pr.ovSource === 'lh' ? 'ביוץ משוער (לפי בדיקת ביוץ חיובית)' : 'ביוץ משוער (לפי לוח שנה)', 'predict'); }
        }
      });
    }
    (state.ovLogs || []).forEach(l => {
      if (!inR(l.date)) return;
      const bits = [];
      if (l.lh === 'pos') bits.push('בדיקת ביוץ חיובית'); else if (l.lh === 'neg') bits.push('בדיקת ביוץ שלילית');
      if (l.bbt) bits.push(`חום בסיסי ${l.bbt}°`);
      if (l.pain) bits.push('כאבי ביוץ');
      if (l.mucus) bits.push('הפרשות: ' + l.mucus);
      get(l.date).marks.add('log');
      add(l.date, 'log', 'תיעוד פוריות' + (bits.length ? ': ' + bits.join(', ') : ''), 'medical');
    });
    return map;
  }

  /* ---------------- reminders ---------------- */
  function upcomingReminders(state, refDate, horizon) {
    const t = refDate || today(); const s = state.settings; const R = s.reminders; const H = horizon || 14;
    const out = [];
    const add = (key, date, title, detail) => {
      if (!R[key] || !R[key].on || !isDate(date)) return;
      const notify = addDays(date, -(+R[key].before || 0));
      if (date < t || diffDays(t, notify) > H) return;
      out.push({ key, date, notify, title, detail, id: `${key}:${date}:${title}` });
    };
    const ps = sortedPeriods(state); const last = ps[ps.length - 1];
    const pr = predictions(state, t);
    if (pr) {
      add('period', pr.nextPeriod, 'מחזור צפוי', 'הערכה לפי ממוצע המחזורים');
      add('fertile', pr.fertileStart, 'תחילת חלון פוריות משוער', 'הערכה בלבד');
      add('ovulation', pr.ovulation, 'ביוץ משוער', 'הערכה בלבד');
      if (R.lh && R.lh.on) for (let k = -3; k <= 0; k++) add('lh', addDays(pr.ovulation, k), 'בדיקת ביוץ', 'תזכורת לביצוע בדיקה');
    }
    if (last) {
      const st = taharaStatus(state, last, t);
      if (st.stage === 'waiting') add('hefsek', st.earliestHefsek, 'הפסק טהרה', 'המועד המוקדם לפי ההגדרות שלך');
      if (st.hefsek && !st.tevilaDone) {
        for (let k = 1; k <= 7; k++) {
          const dd = last.tahara.days && last.tahara.days[k];
          if (R.shiva.on && (!dd || !dd.done)) add('shiva', addDays(st.hefsek.date, k), `שבעה נקיים – יום ${k}`, 'בדיקות היום');
          else if (dd && dd.remind && !dd.done) out.push({ key: 'shiva', date: addDays(st.hefsek.date, k), notify: addDays(st.hefsek.date, k), title: `שבעה נקיים – יום ${k}`, detail: 'תזכורת שסימנת', id: `shivaR:${k}:${st.hefsek.date}` });
        }
        add('tevila', st.tevilaPlanned, 'טבילה', 'בערב, לאחר צאת הכוכבים');
      }
      currentOnot(state).forEach(o => { if (o.window) add('onot', o.window.civil, o.label, o.window.text); });
    }
    out.sort((a, b) => cmp(a.notify, b.notify) || cmp(a.date, b.date));
    return out;
  }

  /* ---------------- stats ---------------- */
  function stats(state, months) {
    const t = today();
    const fromD = months ? addDays(t, -Math.round(months * 30.44)) : '0000-01-01';
    const cs = cycles(state).filter(c => c.valid && c.to.start >= fromD);
    const ps = sortedPeriods(state).filter(p => p.start >= fromD);
    const bl = ps.map(bleedLength).filter(v => v && v < 15);
    const hf = haflagot(state).filter(h => h.to.start >= fromD);
    const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
    const luteal = +state.settings.luteal || 14;
    return {
      cycles: cs, periods: ps, haflagot: hf,
      avgCycle: avg(cs.map(c => c.length)), minCycle: cs.length ? Math.min(...cs.map(c => c.length)) : null, maxCycle: cs.length ? Math.max(...cs.map(c => c.length)) : null,
      avgBleed: avg(bl), avgHaflagah: avg(hf.map(h => h.length)),
      ovHistory: cs.map(c => ({ cycleStart: c.start, ovulation: addDays(c.to.start, -luteal), length: c.length }))
    };
  }

  const API = {
    TZ, dn, ds, addDays, diffDays, isDate, cmp, weekday, today, nowJerusalem, tzOffsetMin,
    GREG_MONTHS, WEEKDAYS, WEEKDAYS_SHORT, gregStr, gregShort,
    heb, hebStr, hebDay, hebMonthYear, gematria, sameHebDayNextMonth,
    sunTimes, hm, parseHM, CITIES, defaultSettings, mergeSettings,
    sortedPeriods, bleedLength, cycles, avgCycle, avgBleed, predictions,
    vesetOnah, onahWindow, haflagot, onotFor, currentOnot, patterns,
    taharaStatus, buildEvents, upcomingReminders, stats
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.TE = API;
})(typeof self !== 'undefined' ? self : this);
