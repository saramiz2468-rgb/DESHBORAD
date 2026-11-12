/* TAHARA – UI layer. All data stays on this device (localStorage, optionally AES-GCM encrypted with a personal PIN). */
(function () {
  'use strict';
  const E = window.TE;
  const $ = s => document.querySelector(s);
  const KEY_PLAIN = 'tahara.data.v1';
  const KEY_ENC = 'tahara.enc.v1';

  /* ================= icons ================= */
  const P = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${extra || ''}>${d}</svg>`;
  const I = {
    home: P('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/>'),
    cal: P('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    drop: P('<path d="M12 3.5c3.5 4.2 6 7.6 6 10.8a6 6 0 0 1-12 0c0-3.2 2.5-6.6 6-10.8Z"/>'),
    moon: P('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>'),
    leaf: P('<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z"/><path d="M5 19 13 11"/>'),
    dots: P('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
    plus: P('<path d="M12 5v14M5 12h14"/>'),
    chevL: P('<path d="m15 6-6 6 6 6"/>'),
    chevR: P('<path d="m9 6 6 6-6 6"/>'),
    edit: P('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>'),
    trash: P('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    bell: P('<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Z"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    lock: P('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
    gear: P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>'),
    chart: P('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    book: P('<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v16H5.5A1.5 1.5 0 0 0 4 20.5v-16Z"/><path d="M4 20.5A1.5 1.5 0 0 0 5.5 22H20"/>'),
    download: P('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    upload: P('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
    check: P('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 'stroke-width="2.6"'),
    sparkle: P('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
    water: P('<path d="M2 15c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><path d="M2 19c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><path d="M12 3c2 2.5 3.5 4.5 3.5 6.3a3.5 3.5 0 0 1-7 0C8.5 7.5 10 5.5 12 3Z"/>'),
    shield: P('<path d="M12 3 4.5 6v6c0 4.5 3.2 8 7.5 9 4.3-1 7.5-4.5 7.5-9V6L12 3Z"/><path d="m9 12 2 2 4-4"/>'),
    sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    x: P('<path d="M6 6l12 12M18 6 6 18"/>'),
    file: P('<path d="M14 3H6v18h12V7l-4-4Z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>'),
    logo: `<svg viewBox="0 0 64 64"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9A3A8"/><stop offset="1" stop-color="#B8925A"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="#FBF3EC" stroke="url(#lg)" stroke-width="1.5"/><path d="M32 13c7 8.5 12 15.2 12 21.6a12 12 0 0 1-24 0C20 28.2 25 21.5 32 13Z" fill="none" stroke="url(#lg)" stroke-width="2.4"/><circle cx="32" cy="35" r="4" fill="url(#lg)"/></svg>`
  };

  /* ================= state & storage ================= */
  let state = null;
  let cryptoKey = null;
  let saveTimer = null;
  let lastActive = Date.now();
  const ui = { calMonth: null, calSel: null, statsRange: 6, taharaPeriod: null };

  function blankState() { return { v: 1, created: new Date().toISOString(), onboarded: false, settings: E.defaultSettings(), periods: [], ovLogs: [], notified: {}, pinEnabled: false }; }
  function normalize(s) {
    s = Object.assign(blankState(), s || {});
    s.settings = E.mergeSettings(s.settings);
    s.periods = Array.isArray(s.periods) ? s.periods : [];
    s.ovLogs = Array.isArray(s.ovLogs) ? s.ovLogs : [];
    s.notified = s.notified || {};
    return s;
  }
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { toast('שמירה נכשלה – ייתכן שהאחסון מלא או חסום'); return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  const b64 = { enc: buf => btoa(String.fromCharCode(...new Uint8Array(buf))), dec: s => Uint8Array.from(atob(s), c => c.charCodeAt(0)) };
  async function deriveKey(pin, salt) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function encryptState(key, salt) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(state)));
    return JSON.stringify({ salt: b64.enc(salt), iv: b64.enc(iv), ct: b64.enc(ct) });
  }
  let encSalt = null;
  function save(immediate) {
    clearTimeout(saveTimer);
    const run = async () => {
      if (state.pinEnabled && cryptoKey) { ls.set(KEY_ENC, await encryptState(cryptoKey, encSalt)); ls.del(KEY_PLAIN); }
      else if (!state.pinEnabled) { ls.set(KEY_PLAIN, JSON.stringify(state)); ls.del(KEY_ENC); }
    };
    if (immediate) return run();
    saveTimer = setTimeout(run, 120);
  }
  function commit(msg) { save(); render(); if (msg) toast(msg); }

  /* ================= helpers ================= */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const T = () => E.today();
  function dual(s, opts) {
    if (!E.isDate(s)) return '—';
    const mode = state.settings.dateMode; const g = E.gregStr(s, opts); const h = E.hebStr(s, opts);
    if (mode === 'greg') return esc(g);
    if (mode === 'heb') return `${esc(h)}<small>${esc(g)}</small>`;
    return `${esc(g)}<small>${esc(h)}</small>`;
  }
  function dualInline(s, opts) {
    if (!E.isDate(s)) return '—';
    const mode = state.settings.dateMode; const g = E.gregStr(s, opts); const h = E.hebStr(s, opts);
    if (mode === 'greg') return g; if (mode === 'heb') return `${h} (${g})`;
    return `${g} · ${h}`;
  }
  function rel(n) {
    if (n === 0) return 'היום'; if (n === 1) return 'מחר'; if (n === -1) return 'אתמול';
    if (n === 2) return 'מחרתיים';
    return n > 0 ? `בעוד ${n} ימים` : `לפני ${-n} ימים`;
  }
  const fmt1 = v => v == null ? '—' : (Math.round(v * 10) / 10).toString();
  const lastPeriod = () => { const ps = E.sortedPeriods(state); return ps[ps.length - 1] || null; };
  const findPeriod = id => state.periods.find(p => p.id === id);
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); }
  function onahLabel(o) { return o === 'night' ? 'עונת לילה' : o === 'full' ? 'מעת לעת (יום ולילה)' : 'עונת יום'; }

  /* ================= navigation ================= */
  const NAV = [
    { id: 'home', label: 'בית', icon: 'home' },
    { id: 'calendar', label: 'לוח שנה', icon: 'cal' },
    { id: 'tahara', label: 'טהרה', icon: 'water' },
    { id: 'onot', label: 'עונות', icon: 'moon' },
    { id: 'fertility', label: 'פוריות', icon: 'leaf' },
    { id: 'more', label: 'עוד', icon: 'dots' }
  ];
  const SIDE_EXTRA = [
    { id: 'stats', label: 'סטטיסטיקות', icon: 'chart' },
    { id: 'history', label: 'היסטוריה', icon: 'book' },
    { id: 'reminders', label: 'תזכורות', icon: 'bell' },
    { id: 'settings', label: 'הגדרות ופרטיות', icon: 'gear' }
  ];
  const route = () => (location.hash.replace('#', '') || 'home').split('/')[0];
  function renderNav() {
    const r = route(); const moreIds = ['more', 'stats', 'history', 'reminders', 'settings'];
    const item = (n, isSide) => `<a href="#${n.id}" class="nav-item ${(r === n.id || (!isSide && n.id === 'more' && moreIds.includes(r))) ? 'active' : ''}">${I[n.icon]}<span>${n.label}</span></a>`;
    $('#bottom-nav').innerHTML = NAV.map(n => item(n)).join('');
    $('#sidebar').innerHTML = `<div class="brand">T A H A R A</div>` + NAV.filter(n => n.id !== 'more').map(n => item(n, true)).join('') + `<div style="height:14px"></div>` + SIDE_EXTRA.map(n => item(n, true)).join('');
  }

  function render() {
    if (!state) return;
    document.documentElement.dataset.theme = state.settings.theme === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : state.settings.theme;
    const v = $('#view');
    if (!state.onboarded) { $('#bottom-nav').classList.add('hidden'); $('#sidebar').classList.add('hidden'); v.innerHTML = viewWelcome(); return; }
    $('#bottom-nav').classList.remove('hidden'); $('#sidebar').classList.remove('hidden');
    renderNav();
    const r = route();
    const views = { home: viewHome, calendar: viewCalendar, tahara: viewTahara, onot: viewOnot, fertility: viewFertility, more: viewMore, stats: viewStats, history: viewHistory, reminders: viewReminders, settings: viewSettings };
    const fn = views[r] || viewHome;
    if (render._last !== r) { v.classList.remove('view'); void v.offsetWidth; v.classList.add('view'); render._last = r; }
    v.innerHTML = fn();
    if (r === 'stats') afterStats();
  }

  function top(title, sub, right) {
    return `<div class="topbar"><div><div class="brand">T A H A R A</div><h1 class="page-title">${title}</h1>${sub ? `<p class="subtitle">${sub}</p>` : ''}</div>${right || ''}</div>`;
  }
  const disclaimerHal = `<div class="note warn">החישובים ההלכתיים מוצגים ככלי עזר טכני בלבד, לפי ההגדרות שבחרת. הם אינם פסק הלכה. בכל שאלה יש לפנות לרב או ליועצת הלכה.</div>`;
  const disclaimerMed = `<div class="note">החישוב לפי לוח השנה הוא הערכה סטטיסטית בלבד. הוא אינו קובע בוודאות את יום הביוץ ואינו מחליף בדיקה או ייעוץ רפואי.</div>`;

  /* ================= welcome / onboarding ================= */
  function viewWelcome() {
    return `<div class="welcome">
      <div class="logo">${I.logo}</div>
      <h1>TAHARA</h1>
      <p class="lead">יומן אישי למעקב מחזור, טהרת המשפחה, ימי הפלגה ופוריות</p>
      <div class="card" style="text-align:right">
        <div class="feature-list">
          <div>${I.shield}<span><b>פרטי לגמרי.</b> המידע נשמר רק במכשיר הזה, ואינו נשלח לשום שרת או גורם חיצוני. אפשר להצפין אותו בקוד אישי.</span></div>
          <div>${I.cal}<span>לוח שנה אחד שמרכז מחזור, ימי המתנה, הפסק טהרה, שבעה נקיים, טבילה, עונות, ביוץ וחלון פוריות.</span></div>
          <div>${I.moon}<span>חישוב טכני של ימי הפלגה, וסת החודש ועונה בינונית, לפי ההגדרות שקיבלת מהרב.</span></div>
          <div>${I.sparkle}<span>תאריך עברי לצד הלועזי בכל מקום.</span></div>
        </div>
        <form data-form="onboard">
          <div class="row2">
            <div class="field"><label>אורך מחזור משוער (ימים)</label><input class="input" type="number" name="cycleLength" min="18" max="45" value="28" inputmode="numeric"></div>
            <div class="field"><label>ימי דימום משוערים</label><input class="input" type="number" name="bleedDays" min="1" max="12" value="5" inputmode="numeric"></div>
          </div>
          <div class="field"><label>עיר (לחישוב שקיעה וזריחה)</label><select class="input" name="city">${Object.entries(E.CITIES).map(([k, c]) => `<option value="${k}">${c.name}</option>`).join('')}</select></div>
          <div class="field"><label>ימים מתחילת הווסת עד הפסק טהרה מוקדם</label>
            <select class="input" name="minHefsekDays"><option value="5">5 ימים (מנהג אשכנז)</option><option value="4">4 ימים (מנהג ספרד)</option></select>
            <small>אפשר לשנות בכל עת בהגדרות, לפי הנחיית הרב.</small></div>
          <button class="btn block" type="submit">התחלה</button>
        </form>
      </div>
      <p class="faint" style="margin-top:16px">האפליקציה מתחילה ריקה. הנתונים שתזיני הם הנתונים היחידים שיוצגו.</p>
    </div>`;
  }

  /* ================= HOME ================= */
  function viewHome() {
    const t = T(); const p = lastPeriod(); const pr = E.predictions(state, t);
    const head = top('שלום', `${E.gregStr(t, { weekday: true })} · ${E.hebStr(t)}`, `<button class="icon-btn" data-act="lock-now" aria-label="נעילה">${I.lock}</button>`);
    if (!p) {
      return head + `<div class="card hero"><div class="empty" style="position:relative;z-index:1">${I.drop}<h2 style="margin:4px 0">עדיין אין נתונים</h2><p>כדי להתחיל, הזיני את תאריך תחילת המחזור האחרון.<br>כל החישובים יתעדכנו אוטומטית.</p><div style="margin-top:16px"><button class="btn" data-act="period-new">${I.plus} הוספת מחזור ראשון</button></div></div></div>`;
    }
    const cd = pr.cycleDay; const L = pr.cycleLen;
    const pct = Math.max(0, Math.min(1, cd / L)); const C = 2 * Math.PI * 56;
    const bl = E.bleedLength(p);
    const st = E.taharaStatus(state, p, t);
    const onot = E.currentOnot(state).filter(o => o.hdate && o.window && o.window.civil >= t);
    const hf = E.haflagot(state); const lastH = hf[hf.length - 1];
    const rem = E.upcomingReminders(state, t, 7).filter(r => r.notify <= E.addDays(t, 3)).slice(0, 4);

    let heroLine = `היום ה-${cd} במחזור`;
    if (pr.late > 0) heroLine = `המחזור הצפוי מאחר ב-${pr.late} ${pr.late === 1 ? 'יום' : 'ימים'}`;
    const ring = `<div class="ring"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="56" stroke="rgba(255,255,255,.7)" stroke-width="10" fill="none"/><circle cx="66" cy="66" r="56" stroke="url(#rg)" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/><defs><linearGradient id="rg"><stop offset="0" stop-color="#D49AA0"/><stop offset="1" stop-color="#B8925A"/></linearGradient></defs></svg><div class="center"><div><b>${cd}</b><span>יום במחזור</span></div></div></div>`;

    let taharaCard;
    if (st.stage === 'waiting') {
      taharaCard = `<dl class="kv"><dt>הפסק טהרה</dt><dd>טרם הוזן</dd><dt>מוקדם לפי ההגדרות</dt><dd>${dual(st.earliestHefsek, { year: false })}</dd></dl><div style="margin-top:12px"><button class="btn sm soft" data-act="hefsek-open" data-id="${p.id}">רישום הפסק טהרה</button></div>`;
    } else {
      const stageTxt = { hefsek: 'הספירה תתחיל מחר', shiva: `יום ${st.dayIndex} מתוך 7`, tevila: 'שבעה נקיים הסתיימו', done: 'הטבילה סומנה כבוצעה' }[st.stage];
      taharaCard = `<dl class="kv"><dt>הפסק טהרה</dt><dd>${dual(st.hefsek.date, { year: false })}</dd><dt>שבעה נקיים</dt><dd>${stageTxt}</dd>${st.stage === 'shiva' ? `<dt>נותרו</dt><dd>${st.remaining} ימים</dd>` : ''}<dt>${st.tevilaDone ? 'טבילה' : 'טבילה מתוכננת'}</dt><dd>${dual(st.tevilaDone && st.tevilaActual ? st.tevilaActual : st.tevilaPlanned, { year: false })}</dd></dl>
      ${st.stage === 'shiva' ? `<div class="progress" style="margin-top:12px"><b style="width:${(st.dayIndex / 7) * 100}%"></b></div>` : ''}`;
    }

    return head + `
    <div class="card hero">
      <div class="hero-row">${ring}
        <div><h2>${heroLine}</h2><p>מחזור אחרון התחיל ${dualInline(p.start, { year: false })}</p>
          <div class="hero-chips"><span class="chip-sm">מחזור הבא: ${pr.daysToNext >= 0 ? rel(pr.daysToNext) : 'באיחור'}</span><span class="chip-sm">ביוץ: ${pr.daysToOv >= 0 ? rel(pr.daysToOv) : 'עבר'}</span></div>
        </div></div>
    </div>
    ${rem.length ? `<div class="section-label">תזכורות קרובות</div><div class="card">${rem.map(r => `<div class="list-row"><div><div class="t">${esc(r.title)}</div><div class="s">${esc(E.gregStr(r.date, { year: false }))} · ${esc(E.hebStr(r.date, { year: false }))}</div></div><span class="pill-days">${rel(E.diffDays(t, r.date))}</span></div>`).join('')}</div>` : ''}
    <div class="section-label">תמונת מצב</div>
    <div class="grid two">
      <div class="card link" data-go="history">
        <div class="card-head"><h3 class="card-title"><span class="dot-ic" style="background:var(--rose-soft);color:var(--rose-deep)">${I.drop}</span>המחזור הנוכחי</h3><span class="tag medical">רפואי</span></div>
        <dl class="kv"><dt>תחילת המחזור</dt><dd>${dual(p.start, { year: false })}</dd><dt>היום במחזור</dt><dd>${cd}</dd><dt>ימים שעברו</dt><dd>${cd - 1}</dd><dt>ימי דימום</dt><dd>${bl ? bl : 'טרם הוזן סיום'}</dd><dt>אורך מחזור ממוצע</dt><dd>${fmt1(pr.avgCycle.value)} ${pr.avgCycle.fromData ? '' : '<small>לפי הגדרה</small>'}</dd></dl>
      </div>
      <div class="card link" data-go="tahara">
        <div class="card-head"><h3 class="card-title"><span class="dot-ic" style="background:var(--gold-soft);color:var(--gold)">${I.water}</span>טהרת המשפחה</h3><span class="tag halacha">הלכתי</span></div>
        ${taharaCard}
      </div>
      <div class="card link" data-go="fertility">
        <div class="card-head"><h3 class="card-title"><span class="dot-ic" style="background:#E7F2F8;color:#4F86A6">${I.leaf}</span>פוריות וביוץ</h3><span class="tag predict">הערכה</span></div>
        <dl class="kv"><dt>ביוץ משוער</dt><dd>${dual(pr.ovulation, { year: false })}</dd><dt>ימים עד הביוץ</dt><dd>${pr.daysToOv >= 0 ? pr.daysToOv : 'עבר'}</dd><dt>חלון פוריות</dt><dd>${E.gregShort(pr.fertileStart)} – ${E.gregShort(pr.fertileEnd)}</dd><dt>מחזור הבא משוער</dt><dd>${dual(pr.nextPeriod, { year: false })}</dd></dl>
      </div>
      <div class="card link" data-go="onot">
        <div class="card-head"><h3 class="card-title"><span class="dot-ic" style="background:var(--brown-soft);color:var(--brown)">${I.moon}</span>ימי הפלגה ועונות</h3><span class="tag halacha">הלכתי</span></div>
        <dl class="kv"><dt>הפלגה אחרונה</dt><dd>${lastH ? lastH.length + ' יום' : 'נדרשים 2 מחזורים'}</dd>
        ${onot.slice(0, 3).map(o => `<dt>${esc(o.label)}</dt><dd>${esc(E.gregStr(o.window.civil, { year: false }))}<small>${onahLabel(o.onah)}</small></dd>`).join('')}
        ${hf.length > 1 ? `<dt>הפלגות קודמות</dt><dd>${hf.slice(-4, -1).map(h => h.length).join(', ')}</dd>` : ''}</dl>
      </div>
    </div>
    <div style="height:14px"></div>
    <button class="btn fab" data-act="period-new">${I.plus} מחזור חדש</button>`;
  }

  /* ================= PERIOD FORM ================= */
  const SYMPTOMS = ['כאבי בטן', 'כאבי גב', 'כאבי ראש', 'נפיחות', 'רגישות בחזה', 'שינויים במצב הרוח', 'בחילות', 'עייפות', 'אקנה'];
  function periodForm(p) {
    p = p || { start: T(), onahMode: 'auto', symptoms: [], flow: '' };
    const sym = new Set(p.symptoms || []);
    openSheet(`<h3>${p.id ? 'עריכת מחזור' : 'הוספת מחזור חדש'}</h3>
    <form data-form="period" data-id="${p.id || ''}">
      <div class="field"><label>תאריך תחילת המחזור *</label><input class="input" type="date" name="start" required value="${esc(p.start)}" data-heb><div class="heb-hint"></div></div>
      <div class="row2">
        <div class="field"><label>שעת תחילת הדימום</label><input class="input" type="time" name="time" value="${esc(p.time || '')}"></div>
        <div class="field"><label>עונה</label><select class="input" name="onahMode">
          ${[['auto', 'אוטומטי לפי השעה'], ['day', 'עונת יום'], ['nightBefore', 'לילה – לפני הזריחה'], ['nightAfter', 'לילה – אחרי השקיעה'], ['unknown', 'לא ידוע']].map(([v, l]) => `<option value="${v}" ${p.onahMode === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></div>
      </div>
      <div class="note" id="onah-preview" style="margin:-4px 0 14px"></div>
      <div class="row2">
        <div class="field"><label>תאריך סיום הדימום</label><input class="input" type="date" name="end" value="${esc(p.end || '')}" data-heb><div class="heb-hint"></div></div>
        <div class="field"><label>מספר ימי דימום</label><input class="input" type="number" name="bleedDays" min="1" max="20" inputmode="numeric" value="${esc(p.bleedDays || '')}"><small>מתמלא אוטומטית מתאריך הסיום</small></div>
      </div>
      <div class="field"><span class="lbl">עוצמת הדימום</span><div class="seg" data-seg="flow">${[['light', 'קל'], ['medium', 'בינוני'], ['heavy', 'חזק']].map(([v, l]) => `<button type="button" data-val="${v}" class="${p.flow === v ? 'on' : ''}">${l}</button>`).join('')}</div><input type="hidden" name="flow" value="${esc(p.flow || '')}"></div>
      <div class="field"><span class="lbl">תסמינים</span><div class="chips" data-chips="symptoms">${SYMPTOMS.map(s => `<button type="button" class="chip ${sym.has(s) ? 'on' : ''}" data-val="${s}">${s}</button>`).join('')}</div></div>
      <div class="field"><label>הערות אישיות</label><textarea class="input" name="notes">${esc(p.notes || '')}</textarea></div>
      <button class="btn block" type="submit">שמירה</button>
      ${p.id ? `<div style="height:10px"></div><button class="btn block ghost" type="button" data-act="period-delete" data-id="${p.id}" style="color:var(--danger)">${I.trash} מחיקת המחזור</button>` : ''}
    </form>`);
    hebHints(); updateOnahPreview();
  }
  function updateOnahPreview() {
    const f = document.querySelector('form[data-form="period"]'); if (!f) return;
    const box = $('#onah-preview'); const start = f.start.value;
    if (!E.isDate(start)) { box.textContent = ''; return; }
    const sun = E.sunTimes(start, state.settings.lat, state.settings.lon);
    const v = E.vesetOnah({ start, time: f.time.value, onahMode: f.onahMode.value }, state.settings);
    box.innerHTML = v.known
      ? `זריחה ~${E.hm(sun.sunrise)} · שקיעה ~${E.hm(sun.sunset)} (${esc(E.CITIES[state.settings.city] ? E.CITIES[state.settings.city].name : 'מיקום מותאם')}).<br>חישוב טכני: <b>${onahLabel(v.onah)}</b>, תאריך עברי לעונות: <b>${esc(E.hebStr(v.hdate))}</b>`
      : `לא הוזנו שעה או עונה. העונות יחושבו כעונת יום לפי התאריך שהוזן, וזה יסומן כלא ודאי.`;
  }
  function hebHints() { document.querySelectorAll('[data-heb]').forEach(inp => { const h = inp.parentElement.querySelector('.heb-hint'); if (h) h.textContent = E.isDate(inp.value) ? E.hebStr(inp.value) : ''; }); }

  function submitPeriod(f) {
    const id = f.dataset.id; const start = f.start.value;
    if (!E.isDate(start)) return toast('יש להזין תאריך תחילה');
    if (start > T()) return toast('לא ניתן להזין מחזור בתאריך עתידי');
    let end = f.end.value || ''; let bd = f.bleedDays.value ? parseInt(f.bleedDays.value, 10) : null;
    if (end && end < start) return toast('תאריך הסיום מוקדם מתאריך התחילה');
    if (end) bd = E.diffDays(start, end) + 1; else if (bd) end = E.addDays(start, bd - 1);
    const dup = state.periods.find(p => p.start === start && p.id !== id);
    if (dup) return toast('כבר קיים מחזור בתאריך הזה');
    const symptoms = [...f.querySelectorAll('[data-chips="symptoms"] .chip.on')].map(b => b.dataset.val);
    const data = { start, time: f.time.value || '', onahMode: f.onahMode.value, end, bleedDays: bd, flow: f.flow.value, symptoms, notes: f.notes.value.trim() };
    if (id) Object.assign(findPeriod(id), data);
    else state.periods.push(Object.assign({ id: uid(), tahara: { days: {}, tevila: { checklist: state.settings.checklist.map(t => ({ id: uid(), text: t, done: false })) } } }, data));
    closeSheet(); commit(id ? 'המחזור עודכן' : 'המחזור נשמר – כל החישובים עודכנו');
  }

  /* ================= CALENDAR ================= */
  function viewCalendar() {
    const t = T();
    if (!ui.calMonth) ui.calMonth = t.slice(0, 7);
    const [y, m] = ui.calMonth.split('-').map(Number);
    const first = `${ui.calMonth}-01`; const ws = state.settings.weekStart || 0;
    const startOffset = (E.weekday(first) - ws + 7) % 7;
    const gridStart = E.addDays(first, -startOffset);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const gridEnd = E.addDays(gridStart, cells - 1);
    const ev = E.buildEvents(state, gridStart, gridEnd, t);
    const hebRange = (() => { const a = E.hebMonthYear(first), b = E.hebMonthYear(`${ui.calMonth}-${String(daysInMonth).padStart(2, '0')}`); return a === b ? a : `${E.heb(first).m} – ${b}`; })();
    let html = '';
    for (let i = 0; i < 7; i++) html += `<div class="cal-dow">${E.WEEKDAYS_SHORT[(i + ws) % 7]}</div>`;
    for (let i = 0; i < cells; i++) {
      const d = E.addDays(gridStart, i); const e = ev.get(d);
      const cls = ['cal-day']; if (d.slice(0, 7) !== ui.calMonth) cls.push('out'); if (d === t) cls.push('today'); if (d === ui.calSel) cls.push('sel');
      if (e && e.bg) cls.push('bg-' + e.bg);
      const marks = e ? [...e.marks].map(k => `<i style="background:var(--c-${k === 'log' ? 'period' : k})"></i>`).join('') : '';
      html += `<button class="${cls.join(' ')}" data-act="cal-day" data-date="${d}"><span class="g">${+d.slice(8)}</span><span class="h">${E.hebDay(d)}</span>${marks ? `<span class="marks">${marks}</span>` : ''}</button>`;
    }
    const sel = ui.calSel && ev.get(ui.calSel);
    return top('לוח שנה', 'כל האירועים במקום אחד') + `
    <div class="card">
      <div class="cal-head">
        <button class="icon-btn" data-act="cal-prev" aria-label="חודש קודם">${I.chevR}</button>
        <div class="m"><b>${E.GREG_MONTHS[m - 1]} ${y}</b><span>${esc(hebRange)}</span></div>
        <button class="icon-btn" data-act="cal-next" aria-label="חודש הבא">${I.chevL}</button>
      </div>
      <div class="cal-grid">${html}</div>
      <div style="display:flex;justify-content:center;gap:8px;margin-top:12px"><button class="btn sm ghost" data-act="cal-today">היום</button><input type="month" class="input" style="width:auto;min-height:38px;padding:6px 12px" value="${ui.calMonth}" data-act-change="cal-jump"></div>
    </div>
    ${ui.calSel ? `<div class="section-label">${esc(E.gregStr(ui.calSel, { weekday: true }))} · ${esc(E.hebStr(ui.calSel))}</div><div class="card day-detail">${sel && sel.items.length ? sel.items.map(it => `<div class="ev"><i style="background:var(--c-${it.cls === 'predicted' ? 'period' : it.cls === 'log' ? 'period' : it.cls});${it.cls === 'predicted' ? 'background:transparent;border:2px dashed var(--c-period)' : ''}"></i><div>${esc(it.label)} <span class="tag ${it.domain === 'medical' ? 'medical' : it.domain === 'halacha' ? 'halacha' : 'predict'}">${it.domain === 'medical' ? 'רפואי' : it.domain === 'halacha' ? 'הלכתי' : 'הערכה'}</span></div></div>`).join('') : '<div class="faint">אין אירועים ביום זה</div>'}
      <div class="btn-row" style="margin-top:12px">${ui.calSel <= T() ? `<button class="btn sm soft" data-act="period-new" data-date="${ui.calSel}">${I.plus} מחזור שהתחיל ביום זה</button><button class="btn sm ghost" data-act="ov-new" data-date="${ui.calSel}">תיעוד פוריות</button>` : ''}</div></div>` : ''}
    <div class="section-label">מקרא</div>
    <div class="card"><div class="legend">
      <span><i style="background:var(--c-period)"></i>מחזור</span><span><i style="background:var(--c-waiting)"></i>ימי המתנה</span>
      <span><i style="background:var(--c-hefsek)"></i>הפסק טהרה</span><span><i style="background:var(--c-shiva)"></i>שבעה נקיים</span>
      <span><i style="background:var(--c-tevila)"></i>טבילה</span><span><i style="background:var(--c-fertile)"></i>חלון פוריות</span>
      <span><i style="background:var(--c-ovulation);border-radius:50%"></i>ביוץ משוער</span><span><i style="background:var(--c-onah);border-radius:50%"></i>עונות והפלגה</span>
      <span><i style="border:2px dashed var(--c-period)"></i>מחזור צפוי</span>
    </div></div>`;
  }

  /* ================= TAHARA ================= */
  function viewTahara() {
    const ps = E.sortedPeriods(state);
    if (!ps.length) return top('טהרת המשפחה') + `<div class="card empty">${I.water}<p>כדי להתחיל לעקוב אחרי הפסק טהרה, שבעה נקיים וטבילה, הוסיפי מחזור.</p><button class="btn" data-act="period-new">${I.plus} הוספת מחזור</button></div>`;
    const p = (ui.taharaPeriod && findPeriod(ui.taharaPeriod)) || ps[ps.length - 1];
    const t = T(); const st = E.taharaStatus(state, p, t); const th = p.tahara || (p.tahara = { days: {}, tevila: {} });
    const sel = ps.length > 1 ? `<select class="input" style="width:auto;min-height:40px;padding:6px 12px 6px 34px" data-act-change="tahara-period">${ps.slice().reverse().map(x => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>מחזור ${E.gregShort(x.start)}</option>`).join('')}</select>` : '';
    const hef = st.hefsek;

    const hefsekCard = `<div class="card">
      <div class="card-head"><h3 class="card-title"><span class="dot-ic" style="background:#EFE8F7;color:var(--c-hefsek)">${I.sparkle}</span>הפסק טהרה</h3><span class="tag halacha">הלכתי</span></div>
      ${hef ? `<dl class="kv"><dt>תאריך</dt><dd>${dual(hef.date)}</dd>${hef.time ? `<dt>שעה</dt><dd>${esc(hef.time)}</dd>` : ''}<dt>בוצע ונרשם</dt><dd>${hef.done ? 'כן' : 'לא סומן'}</dd>${hef.notes ? `<dt>הערות</dt><dd style="white-space:pre-wrap">${esc(hef.notes)}</dd>` : ''}</dl>
        <div class="btn-row" style="margin-top:12px"><button class="btn sm ghost" data-act="hefsek-open" data-id="${p.id}">${I.edit} עריכה</button><button class="btn sm ghost" data-act="hefsek-reset" data-id="${p.id}">התחלת ספירה מחדש</button></div>`
      : `<p class="muted" style="margin:0 0 6px">מחזור מ-${dualInline(p.start)}</p><p class="faint" style="margin:0 0 12px">המועד המוקדם לפי ההגדרה שלך (${state.settings.minHefsekDays} ימים): <b>${esc(dualInline(st.earliestHefsek, { year: false }))}</b></p><button class="btn soft" data-act="hefsek-open" data-id="${p.id}">${I.plus} רישום הפסק טהרה</button>`}
    </div>`;

    let shivaCard = '';
    if (hef) {
      const days = th.days || {};
      const circles = [1, 2, 3, 4, 5, 6, 7].map(k => {
        const d = E.addDays(hef.date, k); const dd = days[k] || {};
        const flag = (dd.am === 'question' || dd.pm === 'question');
        return `<button class="${dd.done ? 'done' : ''} ${d === t ? 'today' : ''} ${flag ? 'flag' : ''}" data-act="shiva-day" data-id="${p.id}" data-k="${k}" aria-label="יום ${k}">${dd.done ? I.check.replace('<svg', '<svg style="width:20px;height:20px"') : k}</button>`;
      }).join('');
      const labels = [1, 2, 3, 4, 5, 6, 7].map(k => { const d = E.addDays(hef.date, k); return `<span>${d === t ? 'היום' : E.hebDay(d)}</span>`; }).join('');
      const list = [1, 2, 3, 4, 5, 6, 7].map(k => {
        const d = E.addDays(hef.date, k); const dd = days[k] || {};
        const state_ = dd.done ? 'הושלם' : d === t ? 'היום' : d < t ? 'לא סומן' : 'בהמשך';
        return `<div class="list-row click" data-act="shiva-day" data-id="${p.id}" data-k="${k}"><div><div class="t">יום ${k} <span class="faint">· ${state_}</span></div><div class="s">${esc(E.gregStr(d, { weekday: true, year: false }))} · ${esc(E.hebStr(d, { year: false }))}${dd.note ? ' · ' + esc(dd.note.slice(0, 40)) : ''}</div></div><span style="display:flex;gap:6px;align-items:center">${dd.remind ? `<span style="color:var(--gold);width:18px">${I.bell}</span>` : ''}${dd.am ? `<span class="pill-days">בוקר${dd.am === 'question' ? ' ?' : ' ✓'}</span>` : ''}${dd.pm ? `<span class="pill-days">ערב${dd.pm === 'question' ? ' ?' : ' ✓'}</span>` : ''}</span></div>`;
      }).join('');
      const pctDone = (st.completed / 7) * 100;
      shivaCard = `<div class="card">
        <div class="card-head"><h3 class="card-title"><span class="dot-ic" style="background:#E6F2EA;color:var(--ok)">${I.leaf}</span>שבעה נקיים</h3><span class="faint">${st.completed}/7 סומנו</span></div>
        <div class="seven">${circles}</div><div class="seven-lbl">${labels}</div>
        <div class="progress"><b style="width:${pctDone}%"></b></div>
        <p class="faint" style="margin:10px 0 0">${st.stage === 'hefsek' ? 'הספירה מתחילה מחר.' : st.stage === 'shiva' ? `היום: יום ${st.dayIndex} מתוך 7 · נותרו ${st.remaining} ימים` : st.stage === 'tevila' ? 'שבעת הימים חלפו.' : 'הטבילה סומנה כבוצעה.'}</p>
        <div style="margin-top:8px">${list}</div>
        <div class="note" style="margin-top:10px">סימון "הושלם" הוא תיעוד אישי בלבד. הוא אינו אישור הלכתי לתקינות הבדיקות או הספירה.</div>
      </div>`;
    }

    let tevilaCard = '';
    if (hef) {
      const tv = th.tevila || (th.tevila = {});
      if (!Array.isArray(tv.checklist)) tv.checklist = state.settings.checklist.map(x => ({ id: uid(), text: x, done: false }));
      const doneN = tv.checklist.filter(c => c.done).length;
      tevilaCard = `<div class="card">
        <div class="card-head"><h3 class="card-title"><span class="dot-ic" style="background:var(--gold-soft);color:var(--gold)">${I.water}</span>טבילה במקווה</h3><span class="tag halacha">הלכתי</span></div>
        <dl class="kv"><dt>טבילה מתוכננת</dt><dd>${dual(st.tevilaPlanned)}<small>בערב, לאחר צאת הכוכבים${E.isDate(tv.override) ? ' · עודכן ידנית' : ''}</small></dd>
        <dt>טבילה בפועל</dt><dd>${st.tevilaActual ? dual(st.tevilaActual) : '—'}</dd>
        <dt>סטטוס</dt><dd>${tv.done ? 'סומנה כבוצעה' : 'טרם סומנה'}</dd>${tv.notes ? `<dt>הערות</dt><dd style="white-space:pre-wrap">${esc(tv.notes)}</dd>` : ''}</dl>
        <div class="btn-row" style="margin:12px 0 4px"><button class="btn sm ${tv.done ? 'ghost' : 'gold'}" data-act="tevila-toggle" data-id="${p.id}">${tv.done ? 'ביטול סימון' : 'סימון שהטבילה בוצעה'}</button><button class="btn sm ghost" data-act="tevila-edit" data-id="${p.id}">${I.edit} עריכה</button></div>
        <div class="section-label" style="margin-top:18px">רשימת הכנות · ${doneN}/${tv.checklist.length}</div>
        ${tv.checklist.map(c => `<div class="check-row ${c.done ? 'done' : ''}"><button class="cbox ${c.done ? 'on' : ''}" data-act="check-toggle" data-id="${p.id}" data-c="${c.id}" aria-label="סימון">${I.check}</button><span class="txt">${esc(c.text)}</span><button class="link-btn" style="color:var(--ink-faint)" data-act="check-del" data-id="${p.id}" data-c="${c.id}" aria-label="מחיקה">${I.x.replace('<svg', '<svg style="width:16px;height:16px"')}</button></div>`).join('')}
        <form data-form="check-add" data-id="${p.id}" style="display:flex;gap:8px;margin-top:10px"><input class="input" name="text" placeholder="הוספת פריט להכנות…" maxlength="80"><button class="btn sm" type="submit">${I.plus}</button></form>
      </div>`;
    }
    return top('טהרת המשפחה', 'הפסק טהרה · שבעה נקיים · טבילה', sel) + `<div class="grid">${hefsekCard}${shivaCard}${tevilaCard}${disclaimerHal}</div>`;
  }

  function hefsekForm(p) {
    const h = (p.tahara && p.tahara.hefsek) || {};
    const st = E.taharaStatus(state, p);
    openSheet(`<h3>הפסק טהרה</h3><form data-form="hefsek" data-id="${p.id}">
      <div class="field"><label>תאריך ההפסק *</label><input class="input" type="date" name="date" required value="${esc(h.date || (T() >= st.earliestHefsek ? T() : st.earliestHefsek))}" data-heb><div class="heb-hint"></div><small>המועד המוקדם לפי ההגדרה שלך: ${esc(dualInline(st.earliestHefsek, { year: false }))}</small></div>
      <div class="field"><label>שעת ביצוע</label><input class="input" type="time" name="time" value="${esc(h.time || '')}"><small id="sunset-hint"></small></div>
      <label class="list-row" style="cursor:pointer"><span class="t">ההפסק בוצע ונרשם</span><span class="switch"><input type="checkbox" name="done" ${h.done || !h.date ? 'checked' : ''}><span></span></span></label>
      <div class="field" style="margin-top:12px"><label>הערות אישיות</label><textarea class="input" name="notes">${esc(h.notes || '')}</textarea></div>
      <button class="btn block" type="submit">שמירה ויצירת לוח שבעה נקיים</button></form>`);
    hebHints(); sunsetHint();
  }
  function sunsetHint() { const f = document.querySelector('form[data-form="hefsek"]'); if (!f) return; const el = $('#sunset-hint'); if (E.isDate(f.date.value)) { const s = E.sunTimes(f.date.value, state.settings.lat, state.settings.lon); el.textContent = `שקיעה משוערת ביום זה: ~${E.hm(s.sunset)} (חישוב אסטרונומי משוער – יש לבדוק בלוח זמנים מוסמך)`; } }
  function submitHefsek(f) {
    const p = findPeriod(f.dataset.id); const date = f.date.value;
    if (!E.isDate(date)) return toast('יש להזין תאריך');
    if (date < p.start) return toast('תאריך ההפסק מוקדם מתחילת המחזור');
    const ps = E.sortedPeriods(state); const nx = ps[ps.findIndex(x => x.id === p.id) + 1];
    if (nx && date >= nx.start) return toast('התאריך מאוחר מתחילת המחזור הבא');
    p.tahara = p.tahara || { days: {}, tevila: {} };
    const changed = p.tahara.hefsek && p.tahara.hefsek.date !== date;
    p.tahara.hefsek = { date, time: f.time.value, done: f.done.checked, notes: f.notes.value.trim() };
    if (changed && p.tahara.tevila) p.tahara.tevila.override = '';
    closeSheet(); commit('הפסק הטהרה נשמר');
  }

  function shivaSheet(p, k) {
    const hef = p.tahara.hefsek.date; const d = E.addDays(hef, k);
    const dd = (p.tahara.days || {})[k] || {};
    const seg = (name, val) => `<div class="seg" data-seg="${name}">${[['', 'לא תועד'], ['done', 'בוצעה'], ['question', 'לבירור']].map(([v, l]) => `<button type="button" data-val="${v}" class="${(val || '') === v ? 'on' : ''}">${l}</button>`).join('')}</div><input type="hidden" name="${name}" value="${esc(val || '')}">`;
    openSheet(`<h3>שבעה נקיים · יום ${k}</h3><p class="muted" style="margin:-8px 0 16px">${esc(E.gregStr(d, { weekday: true }))}<br><span style="color:var(--gold)">${esc(E.hebStr(d))}</span></p>
    <form data-form="shiva" data-id="${p.id}" data-k="${k}">
      <div class="field"><span class="lbl">בדיקת בוקר</span>${seg('am', dd.am)}</div>
      <div class="field"><span class="lbl">בדיקת ערב (לפני השקיעה)</span>${seg('pm', dd.pm)}</div>
      <label class="list-row" style="cursor:pointer"><span class="t">היום הושלם (תיעוד אישי)</span><span class="switch"><input type="checkbox" name="done" ${dd.done ? 'checked' : ''}><span></span></span></label>
      <label class="list-row" style="cursor:pointer"><span><span class="t">תזכורת לבדיקה ביום זה</span><br><span class="s">מופיעה במסך הבית ובהתראות</span></span><span class="switch"><input type="checkbox" name="remind" ${dd.remind ? 'checked' : ''}><span></span></span></label>
      <div class="field" style="margin-top:12px"><label>הערה</label><textarea class="input" name="note">${esc(dd.note || '')}</textarea></div>
      <div class="note" style="margin-bottom:14px">"לבירור" מסמן לעצמך שיש שאלה להציג לרב. האפליקציה לא מסיקה ממנו דבר.</div>
      <button class="btn block" type="submit">שמירה</button></form>`);
  }
  function tevilaSheet(p) {
    const st = E.taharaStatus(state, p); const tv = p.tahara.tevila || {};
    openSheet(`<h3>עריכת טבילה</h3><form data-form="tevila" data-id="${p.id}">
      <div class="field"><label>תאריך טבילה מתוכנן (ערב)</label><input class="input" type="date" name="override" value="${esc(E.isDate(tv.override) ? tv.override : st.tevilaPlanned)}" data-heb><div class="heb-hint"></div><small>ברירת המחדל: ערב היום השביעי (${esc(E.gregShort(st.day7))}). שינוי כאן הוא תיקון ידני.</small></div>
      <div class="field"><label>תאריך טבילה בפועל</label><input class="input" type="date" name="actual" value="${esc(tv.actual || '')}" data-heb><div class="heb-hint"></div></div>
      <label class="list-row" style="cursor:pointer"><span class="t">הטבילה בוצעה</span><span class="switch"><input type="checkbox" name="done" ${tv.done ? 'checked' : ''}><span></span></span></label>
      <div class="field" style="margin-top:12px"><label>הערות אישיות</label><textarea class="input" name="notes">${esc(tv.notes || '')}</textarea></div>
      <button class="btn block" type="submit">שמירה</button></form>`);
    hebHints();
  }

  /* ================= ONOT ================= */
  function viewOnot() {
    const t = T(); const ps = E.sortedPeriods(state); const s = state.settings;
    if (!ps.length) return top('ימי הפלגה ועונות') + `<div class="card empty">${I.moon}<p>כדי לחשב עונות, הזיני את תאריך הווסת האחרונה. מומלץ להזין גם את השעה.</p><button class="btn" data-act="period-new">${I.plus} הוספת מחזור</button></div>`;
    const last = ps[ps.length - 1]; const v = E.vesetOnah(last, s);
    const on = E.currentOnot(state); const hf = E.haflagot(state); const pats = E.patterns(state);
    const lastH = hf[hf.length - 1];
    const maxLen = Math.max(...hf.map(h => h.length), 1);
    const onahRow = o => {
      if (!o.hdate) return `<div class="onah"><div class="ic">${I.moon}</div><div class="b"><div class="t">${esc(o.label)}</div><div class="w">${esc(o.info)}</div></div></div>`;
      const n = E.diffDays(t, o.window.civil);
      return `<div class="onah" style="${n < 0 ? 'opacity:.55' : ''}"><div class="ic">${o.onah === 'day' ? I.sun : I.moon}</div><div class="b"><div class="t">${esc(o.label)}</div>
        <div class="d"><bdi>${esc(E.gregStr(o.hdate, { weekday: true, year: false }))}</bdi> · <bdi>${esc(E.hebStr(o.hdate))}</bdi></div>
        <div class="w">${onahLabel(o.onah)} · ${esc(o.window.text)}</div>${o.info ? `<div class="w">${esc(o.info)}</div>` : ''}</div><span class="pill-days">${n < 0 ? 'עבר' : rel(n)}</span></div>`;
    };
    return top('ימי הפלגה ועונות', 'חישוב טכני לפי ההגדרות שלך') + `
    <div class="grid">
      <div class="card">
        <div class="card-head"><h3 class="card-title"><span class="dot-ic" style="background:var(--brown-soft);color:var(--brown)">${I.moon}</span>הווסת האחרונה</h3><span class="tag halacha">הלכתי</span></div>
        <dl class="kv"><dt>תאריך</dt><dd>${dual(last.start)}</dd><dt>שעה</dt><dd>${last.time ? esc(last.time) : 'לא הוזנה'}</dd><dt>עונה</dt><dd>${v.known ? onahLabel(v.onah) : 'לא ידועה'}</dd><dt>תאריך עברי לחישוב</dt><dd>${esc(E.hebStr(v.hdate))}</dd><dt>הפלגה אחרונה</dt><dd>${lastH ? lastH.length + ' יום' : '—'}</dd></dl>
        ${!v.known ? `<div class="note warn" style="margin-top:12px">לא הוזנו שעה או עונה לווסת האחרונה, ולכן לא ידוע אם העונה של יום או של לילה. כדי לדייק את החישוב, ערכי את המחזור.</div>` : ''}
        <div style="margin-top:12px"><button class="btn sm ghost" data-act="period-edit" data-id="${last.id}">${I.edit} עריכת הווסת</button></div>
      </div>
      <div class="card"><div class="card-head"><h3 class="card-title">העונות הקרובות</h3></div>${on.length ? on.map(onahRow).join('') : '<p class="faint">אין עונות מחושבות. אפשר להפעיל סוגי חישוב בהגדרות.</p>'}
        ${!hf.length ? '<p class="faint">חישוב ההפלגה ייעשה החל מהמחזור השני שתזיני.</p>' : ''}</div>
      ${pats.length ? `<div class="card"><div class="card-head"><h3 class="card-title">דפוסים שזוהו</h3></div>${pats.map(x => `<div class="note warn" style="margin-bottom:8px">${esc(x)}</div>`).join('')}</div>` : ''}
      <div class="card"><div class="card-head"><h3 class="card-title">היסטוריית הפלגות</h3><span class="faint">${hf.length} הפלגות</span></div>
        ${hf.length ? `<div style="display:grid;gap:8px">${hf.slice().reverse().map(h => `<div style="display:grid;grid-template-columns:76px 1fr 44px;gap:10px;align-items:center;font-size:13px"><span class="muted">${E.gregShort(h.to.start)}</span><div class="progress" style="height:10px"><b style="width:${(h.length / maxLen) * 100}%;background:linear-gradient(90deg,var(--brown),#C9A88E)"></b></div><b>${h.length}</b></div>`).join('')}</div>
        <table class="table" style="margin-top:14px"><thead><tr><th>מווסת</th><th>עד וסת</th><th>אורך</th><th>עונה</th></tr></thead><tbody>${hf.slice().reverse().map(h => `<tr><td>${esc(E.hebStr(h.fromH, { year: false }))}</td><td>${esc(E.hebStr(h.toH, { year: false }))}</td><td>${h.length}</td><td>${h.known ? onahLabel(h.onah) : '?'}</td></tr>`).join('')}</tbody></table>` : '<p class="faint">יוצג לאחר הזנת שני מחזורים לפחות.</p>'}
      </div>
      <div class="card"><div class="card-head"><h3 class="card-title">שיטת החישוב הפעילה</h3><a href="#settings" class="link-btn">שינוי</a></div>
        <div class="chips">${[['haflagah', 'הפלגה'], ['chodesh', 'וסת החודש'], ['beinonit', 'עונה בינונית (30)'], ['beinonit31', 'יום 31'], ['beinonitFull', 'בינונית מעת לעת'], ['ohrZarua', 'אור זרוע'], ['oldHaflagot', 'הפלגות שלא נעקרו']].map(([k, l]) => `<span class="chip ${s.onot[k] ? 'on' : ''}" style="cursor:default">${l}</span>`).join('')}</div>
        <p class="faint" style="margin:12px 0 0">ההפלגה נספרת כולל יום הווסת הקודמת ויום הווסת הנוכחית. העונה (יום או לילה) נקבעת לפי שעת תחילת הווסת ביחס לזריחה ולשקיעה המשוערות ב${esc(E.CITIES[s.city] ? E.CITIES[s.city].name : 'מיקום שהוגדר')}. עונת לילה שייכת לתאריך העברי שמתחיל בשקיעה.</p>
      </div>
      ${disclaimerHal}
    </div>`;
  }

  /* ================= FERTILITY ================= */
  function viewFertility() {
    const t = T(); const pr = E.predictions(state, t);
    if (!pr) return top('פוריות וביוץ') + `<div class="card empty">${I.leaf}<p>כדי לחשב את מועד הביוץ המשוער, הזיני את תחילת המחזור האחרון.</p><button class="btn" data-act="period-new">${I.plus} הוספת מחזור</button></div>`;
    const logs = (state.ovLogs || []).slice().sort((a, b) => E.cmp(b.date, a.date));
    const cycLogs = logs.filter(l => l.date >= pr.lastStart);
    // mini timeline of current cycle
    const L = pr.cycleLen; let tl = '';
    for (let i = 0; i < L; i++) {
      const d = E.addDays(pr.lastStart, i);
      let c = 'var(--bg-2)';
      if (d >= pr.fertileStart && d <= pr.fertileEnd) c = 'var(--c-fertile)';
      if (d === pr.ovulation) c = 'var(--c-ovulation)';
      if (i < Math.round(E.avgBleed(state).value)) c = 'var(--c-period)';
      tl += `<i title="${d}" style="flex:1;height:${d === t ? 22 : 14}px;border-radius:4px;background:${c};${d === t ? 'outline:2px solid var(--ink);outline-offset:1px' : ''}"></i>`;
    }
    const bbt = logs.filter(l => l.bbt && l.date >= pr.lastStart).slice().reverse();
    return top('פוריות וביוץ', 'הערכות לפי היסטוריית המחזורים') + `
    <div class="grid">
      <div class="card">
        <div class="card-head"><h3 class="card-title"><span class="dot-ic" style="background:#E7F2F8;color:#4F86A6">${I.leaf}</span>המחזור הנוכחי</h3><span class="tag predict">הערכה</span></div>
        <div style="display:flex;gap:2px;align-items:flex-end;margin:6px 0 6px">${tl}</div>
        <div style="display:flex;justify-content:space-between" class="faint"><span>יום 1</span><span>יום ${L}</span></div>
        <div class="stat-tiles" style="margin-top:14px">
          <div class="tile"><div class="l">ביוץ משוער</div><div class="v">${E.gregShort(pr.ovulation)}</div><div class="faint">${esc(E.hebStr(pr.ovulation, { year: false }))}</div></div>
          <div class="tile"><div class="l">ימים עד הביוץ</div><div class="v">${pr.daysToOv >= 0 ? pr.daysToOv : '—'}</div><div class="faint">${pr.daysToOv < 0 ? 'עבר במחזור זה' : rel(pr.daysToOv)}</div></div>
          <div class="tile"><div class="l">חלון פוריות</div><div class="v" style="font-size:18px">${E.gregShort(pr.fertileStart)}–${E.gregShort(pr.fertileEnd)}</div><div class="faint">ימים ${E.diffDays(pr.lastStart, pr.fertileStart) + 1}–${E.diffDays(pr.lastStart, pr.fertileEnd) + 1}</div></div>
          <div class="tile"><div class="l">פוריות גבוהה יותר</div><div class="v" style="font-size:18px">${E.gregShort(E.addDays(pr.ovulation, -2))}–${E.gregShort(pr.ovulation)}</div></div>
          <div class="tile"><div class="l">מחזור הבא משוער</div><div class="v" style="font-size:18px">${E.gregShort(pr.nextPeriod)}</div><div class="faint">${pr.daysToNext >= 0 ? rel(pr.daysToNext) : 'באיחור ' + pr.late + ' ימים'}</div></div>
          <div class="tile"><div class="l">אורך מחזור ממוצע</div><div class="v">${fmt1(pr.avgCycle.value)}</div><div class="faint">${pr.avgCycle.fromData ? `לפי ${pr.avgCycle.n} מחזורים` : 'לפי הגדרה התחלתית'}</div></div>
        </div>
        <p class="faint" style="margin:12px 0 0">${pr.ovSource === 'lh' ? 'הביוץ המשוער חושב לפי בדיקת ביוץ חיובית שתיעדת (יום אחרי הבדיקה).' : `ביוץ משוער = מחזור צפוי פחות ${state.settings.luteal} ימים (שלב לוטאלי).`}</p>
      </div>
      <div class="card"><div class="card-head"><h3 class="card-title">תיעוד פוריות</h3><button class="btn sm" data-act="ov-new">${I.plus} תיעוד</button></div>
        ${bbt.length > 1 ? bbtChart(bbt) : ''}
        ${cycLogs.length || logs.length ? logs.slice(0, 30).map(l => `<div class="list-row click" data-act="ov-edit" data-id="${l.id}"><div><div class="t">${esc(E.gregStr(l.date, { weekday: true, year: false }))}</div><div class="s">${[l.lh === 'pos' ? 'בדיקת ביוץ חיובית' : l.lh === 'neg' ? 'בדיקת ביוץ שלילית' : '', l.bbt ? `חום ${l.bbt}°` : '', l.mucus ? `הפרשות: ${l.mucus}` : '', l.pain ? 'כאבי ביוץ' : '', (l.symptoms || []).join(', '), l.notes].filter(Boolean).map(esc).join(' · ') || '—'}</div></div>${l.lh === 'pos' ? '<span class="tag predict">LH+</span>' : ''}</div>`).join('') : '<p class="faint">אין עדיין תיעוד. אפשר לתעד בדיקות ביוץ, חום גוף בסיסי, הפרשות ותסמינים.</p>'}
      </div>
      ${disclaimerMed}
    </div>`;
  }
  function bbtChart(rows) {
    const W = 320, H = 120, pad = 22;
    const vals = rows.map(r => parseFloat(r.bbt)); const mn = Math.min(...vals) - 0.1, mx = Math.max(...vals) + 0.1;
    const x = i => pad + (i * (W - pad * 2)) / Math.max(1, rows.length - 1); const y = v => H - pad - ((v - mn) / (mx - mn || 1)) * (H - pad * 2);
    const path = rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(vals[i]).toFixed(1)}`).join(' ');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" style="margin-bottom:10px"><text x="${W - 4}" y="12" text-anchor="end">חום בסיסי (°C)</text><path d="${path}" fill="none" stroke="var(--rose-deep)" stroke-width="2"/>${rows.map((r, i) => `<circle cx="${x(i)}" cy="${y(vals[i])}" r="3" fill="var(--rose-deep)"/>`).join('')}<text x="${pad}" y="${H - 6}">${E.gregShort(rows[0].date)}</text><text x="${W - pad}" y="${H - 6}" text-anchor="end">${E.gregShort(rows[rows.length - 1].date)}</text><text x="2" y="${y(mx - 0.1) + 3}">${(mx - 0.1).toFixed(2)}</text><text x="2" y="${y(mn + 0.1) + 3}">${(mn + 0.1).toFixed(2)}</text></svg>`;
  }
  const OV_SYMPTOMS = ['רגישות בחזה', 'נפיחות', 'עלייה בחשק', 'כאבי ראש', 'שינויים במצב הרוח'];
  const MUCUS = ['', 'יבש', 'דביק', 'קרמי', 'מימי', 'שקוף ונמתח'];
  function ovForm(l, date) {
    l = l || { date: date || T(), lh: '', symptoms: [] };
    const sym = new Set(l.symptoms || []);
    openSheet(`<h3>${l.id ? 'עריכת תיעוד' : 'תיעוד פוריות'}</h3><form data-form="ov" data-id="${l.id || ''}">
      <div class="field"><label>תאריך</label><input class="input" type="date" name="date" required value="${esc(l.date)}" data-heb><div class="heb-hint"></div></div>
      <div class="field"><span class="lbl">בדיקת ביוץ (LH)</span><div class="seg" data-seg="lh">${[['', 'לא בוצעה'], ['neg', 'שלילית'], ['pos', 'חיובית']].map(([v, t]) => `<button type="button" data-val="${v}" class="${(l.lh || '') === v ? 'on' : ''}">${t}</button>`).join('')}</div><input type="hidden" name="lh" value="${esc(l.lh || '')}"></div>
      <div class="row2"><div class="field"><label>חום גוף בסיסי (°C)</label><input class="input" type="number" step="0.01" min="34" max="40" name="bbt" inputmode="decimal" value="${esc(l.bbt || '')}"></div>
      <div class="field"><label>הפרשות</label><select class="input" name="mucus">${MUCUS.map(m => `<option value="${m}" ${l.mucus === m ? 'selected' : ''}>${m || '—'}</option>`).join('')}</select></div></div>
      <label class="list-row" style="cursor:pointer"><span class="t">כאבי ביוץ</span><span class="switch"><input type="checkbox" name="pain" ${l.pain ? 'checked' : ''}><span></span></span></label>
      <div class="field" style="margin-top:12px"><span class="lbl">תסמינים נוספים</span><div class="chips" data-chips="ovsym">${OV_SYMPTOMS.map(s => `<button type="button" class="chip ${sym.has(s) ? 'on' : ''}" data-val="${s}">${s}</button>`).join('')}</div></div>
      <div class="field"><label>הערות</label><textarea class="input" name="notes">${esc(l.notes || '')}</textarea></div>
      <button class="btn block" type="submit">שמירה</button>
      ${l.id ? `<div style="height:10px"></div><button class="btn block ghost" type="button" data-act="ov-delete" data-id="${l.id}" style="color:var(--danger)">${I.trash} מחיקה</button>` : ''}
    </form>`);
    hebHints();
  }
  function submitOv(f) {
    const id = f.dataset.id; if (!E.isDate(f.date.value)) return toast('יש להזין תאריך');
    const data = { date: f.date.value, lh: f.lh.value, bbt: f.bbt.value, mucus: f.mucus.value, pain: f.pain.checked, symptoms: [...f.querySelectorAll('[data-chips="ovsym"] .chip.on')].map(b => b.dataset.val), notes: f.notes.value.trim() };
    if (id) Object.assign(state.ovLogs.find(l => l.id === id), data); else state.ovLogs.push(Object.assign({ id: uid() }, data));
    closeSheet(); commit('התיעוד נשמר');
  }

  /* ================= MORE ================= */
  function viewMore() {
    const row = (href, icon, t, s) => `<a href="#${href}" class="list-row click" style="text-decoration:none;color:inherit"><span style="display:flex;gap:14px;align-items:center"><span class="dot-ic" style="width:38px;height:38px;border-radius:12px;background:var(--rose-soft);color:var(--rose-deep);display:grid;place-items:center">${icon.replace('<svg', '<svg style="width:19px;height:19px"')}</span><span><span class="t">${t}</span><br><span class="s">${s}</span></span></span>${I.chevL.replace('<svg', '<svg style="width:18px;height:18px;color:var(--ink-faint)"')}</a>`;
    return top('עוד') + `<div class="card">${row('stats', I.chart, 'תחזיות וסטטיסטיקות', 'ממוצעים, מגמות וגרפים')}${row('history', I.book, 'היסטוריה אישית', 'כל המחזורים, כרטיס לכל חודש')}${row('reminders', I.bell, 'תזכורות', 'הפעלה וכיבוי לכל תזכורת')}${row('settings', I.gear, 'הגדרות ופרטיות', 'חישובים, תצוגה, נעילה, ייצוא וגיבוי')}</div>
    <div class="section-label">התקנה במסך הבית</div><div class="card"><p style="margin:0" class="muted">באייפון: פתחי את האתר ב-Safari ← כפתור השיתוף ← "הוספה למסך הבית".<br>באנדרואיד או במחשב (Chrome): תפריט ← "התקנת האפליקציה".</p>${installPrompt ? '<button class="btn sm" style="margin-top:12px" data-act="install">התקנה עכשיו</button>' : ''}</div>`;
  }

  /* ================= STATS ================= */
  function viewStats() {
    const r = ui.statsRange; const s = E.stats(state, r);
    const seg = `<div class="seg" style="margin-bottom:14px">${[[3, '3 חודשים'], [6, '6 חודשים'], [12, 'שנה'], [0, 'הכל']].map(([v, l]) => `<button data-act="stats-range" data-v="${v}" class="${r === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    if (!s.periods.length) return top('תחזיות וסטטיסטיקות') + seg + `<div class="card empty">${I.chart}<p>אין נתונים בטווח הזמן שנבחר.</p></div>`;
    const tile = (l, v, u) => `<div class="tile"><div class="l">${l}</div><div class="v">${v == null ? '—' : v}${v != null && u ? ` <small>${u}</small>` : ''}</div></div>`;
    return top('תחזיות וסטטיסטיקות', 'מבוסס על הנתונים שהזנת בלבד') + seg + `
    <div class="stat-tiles">${tile('אורך מחזור ממוצע', s.avgCycle == null ? null : fmt1(s.avgCycle), 'ימים')}${tile('ממוצע ימי דימום', s.avgBleed == null ? null : fmt1(s.avgBleed), 'ימים')}${tile('המחזור הקצר ביותר', s.minCycle, 'ימים')}${tile('המחזור הארוך ביותר', s.maxCycle, 'ימים')}${tile('ממוצע הפלגה', s.avgHaflagah == null ? null : fmt1(s.avgHaflagah), 'ימים')}${tile('מחזורים בטווח', s.periods.length)}</div>
    <div class="section-label">מגמת אורך המחזור</div><div class="card">${s.cycles.length > 1 ? lineChart(s.cycles.map(c => ({ x: E.gregShort(c.start), y: c.length })), 'var(--rose-deep)') : '<p class="faint">נדרשים לפחות 3 מחזורים להצגת מגמה.</p>'}</div>
    <div class="section-label">ימי דימום לפי חודש</div><div class="card">${barChart(s.periods.map(p => ({ x: E.gregShort(p.start), y: E.bleedLength(p) || 0 })))}</div>
    <div class="section-label">אורך הפלגות</div><div class="card">${s.haflagot.length > 1 ? lineChart(s.haflagot.map(h => ({ x: E.gregShort(h.to.start), y: h.length })), 'var(--brown)') : '<p class="faint">נדרשות לפחות 2 הפלגות.</p>'}</div>
    <div class="section-label">השוואה בין חודשים</div><div class="card" style="overflow-x:auto"><table class="table"><thead><tr><th>תחילה</th><th>עברי</th><th>מחזור</th><th>דימום</th><th>הפלגה</th><th>ביוץ משוער*</th></tr></thead><tbody>
    ${s.periods.slice().reverse().map(p => { const c = E.cycles(state).find(x => x.from.id === p.id); const h = E.haflagot(state).find(x => x.from.id === p.id); return `<tr><td>${E.gregShort(p.start)}</td><td>${esc(E.hebStr(p.start, { year: false }))}</td><td>${c ? c.length : '—'}</td><td>${E.bleedLength(p) || '—'}</td><td>${h ? h.length : '—'}</td><td>${c ? E.gregShort(E.addDays(c.to.start, -state.settings.luteal)) : '—'}</td></tr>`; }).join('')}
    </tbody></table><p class="faint" style="margin:8px 0 0">* ביוץ משוער בדיעבד = תחילת המחזור הבא פחות ${state.settings.luteal} ימים. הערכה בלבד.</p></div>`;
  }
  function afterStats() { /* charts are static SVG; nothing to hydrate */ }
  function lineChart(pts, color) {
    const W = 340, H = 150, pl = 30, pr = 22, pt = 14, pb = 24;
    const ys = pts.map(p => p.y); const mn = Math.min(...ys) - 2, mx = Math.max(...ys) + 2;
    // RTL: oldest on the right
    const x = i => W - pr - (i * (W - pl - pr)) / Math.max(1, pts.length - 1);
    const y = v => pt + (1 - (v - mn) / (mx - mn || 1)) * (H - pt - pb);
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
    const avg = ys.reduce((a, b) => a + b, 0) / ys.length;
    const ticks = [mn + 2, (mn + mx) / 2, mx - 2].map(v => Math.round(v));
    return `<svg class="chart" viewBox="0 0 ${W} ${H}">${ticks.map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="2" y="${y(v) + 3}">${v}</text>`).join('')}
      <line x1="${pl}" x2="${W - pr}" y1="${y(avg)}" y2="${y(avg)}" stroke="${color}" stroke-dasharray="4 4" opacity=".5"/>
      <path d="${path}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/>
      ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.y)}" r="3.5" fill="var(--card)" stroke="${color}" stroke-width="2"/><text x="${x(i)}" y="${y(p.y) - 8}" text-anchor="middle" style="fill:var(--ink-soft)">${p.y}</text>`).join('')}
      ${pts.map((p, i) => (pts.length <= 8 || i % Math.ceil(pts.length / 6) === 0) ? `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? 'end' : i === pts.length - 1 ? 'start' : 'middle'}">${p.x}</text>` : '').join('')}</svg>`;
  }
  function barChart(pts) {
    const W = 340, H = 140, pb = 22, pt = 14; const mx = Math.max(...pts.map(p => p.y), 1);
    const n = pts.length; const bw = Math.min(26, (W - 20) / n - 6);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}">${pts.map((p, i) => { const cx = W - 10 - (i + 0.5) * ((W - 20) / n); const h = (p.y / mx) * (H - pb - pt); return `<rect x="${cx - bw / 2}" y="${H - pb - h}" width="${bw}" height="${h}" rx="6" fill="var(--c-period)"/>${p.y ? `<text x="${cx}" y="${H - pb - h - 4}" text-anchor="middle" style="fill:var(--ink-soft)">${p.y}</text>` : ''}${(n <= 8 || i % Math.ceil(n / 6) === 0) ? `<text x="${cx}" y="${H - 6}" text-anchor="middle">${p.x}</text>` : ''}`; }).join('')}</svg>`;
  }

  /* ================= HISTORY ================= */
  function viewHistory() {
    const ps = E.sortedPeriods(state).reverse();
    if (!ps.length) return top('היסטוריה אישית') + `<div class="card empty">${I.book}<p>ההיסטוריה תתמלא עם כל מחזור שתזיני.</p><button class="btn" data-act="period-new">${I.plus} הוספת מחזור</button></div>`;
    const cyc = E.cycles(state); const hf = E.haflagot(state);
    return top('היסטוריה אישית', `${ps.length} מחזורים מתועדים`) + `<div class="grid">${ps.map(p => {
      const c = cyc.find(x => x.from.id === p.id); const h = hf.find(x => x.to.id === p.id); const st = E.taharaStatus(state, p);
      return `<div class="card link" data-act="history-open" data-id="${p.id}">
        <div class="card-head"><h3 class="card-title" style="flex-direction:column;align-items:flex-start;gap:0"><span>${esc(E.GREG_MONTHS[+p.start.slice(5, 7) - 1])} ${p.start.slice(0, 4)}</span><span class="faint" style="font-weight:400">${esc(E.hebMonthYear(p.start))}</span></h3>${c ? `<span class="pill-days">מחזור ${c.length} יום</span>` : '<span class="pill-days">נוכחי</span>'}</div>
        <dl class="kv"><dt>תחילת מחזור</dt><dd>${dual(p.start, { year: false })}</dd><dt>סיום דימום</dt><dd>${p.end ? dual(p.end, { year: false }) : '—'}</dd><dt>ימי דימום</dt><dd>${E.bleedLength(p) || '—'}</dd>
        <dt>הפסק טהרה</dt><dd>${st.hefsek ? E.gregShort(st.hefsek.date) : '—'}</dd><dt>שבעה נקיים</dt><dd>${st.hefsek ? `${st.completed}/7 סומנו` : '—'}</dd><dt>טבילה</dt><dd>${st.hefsek ? (st.tevilaDone ? E.gregShort(st.tevilaActual || st.tevilaPlanned) + ' ✓' : E.gregShort(st.tevilaPlanned) + ' (מתוכנן)') : '—'}</dd>
        <dt>הפלגה</dt><dd>${h ? h.length + ' יום' : '—'}</dd><dt>ביוץ משוער</dt><dd>${c ? E.gregShort(E.addDays(c.to.start, -state.settings.luteal)) : '—'}</dd></dl>
        ${p.notes ? `<p class="faint" style="margin:10px 0 0;white-space:pre-wrap">${esc(p.notes)}</p>` : ''}
      </div>`;
    }).join('')}</div>`;
  }
  function historySheet(p) {
    const st = E.taharaStatus(state, p); const idx = E.sortedPeriods(state).findIndex(x => x.id === p.id);
    const on = E.onotFor(state, idx); const v = E.vesetOnah(p, state.settings);
    const flow = { light: 'קל', medium: 'בינוני', heavy: 'חזק' }[p.flow] || '—';
    const days = (p.tahara && p.tahara.days) || {};
    openSheet(`<h3>מחזור ${esc(E.gregStr(p.start))}</h3>
      <div class="section-label" style="margin-top:0">מעקב רפואי</div>
      <dl class="kv"><dt>תחילה</dt><dd>${dual(p.start)}</dd><dt>שעה</dt><dd>${esc(p.time || '—')}</dd><dt>סיום דימום</dt><dd>${p.end ? dual(p.end) : '—'}</dd><dt>ימי דימום</dt><dd>${E.bleedLength(p) || '—'}</dd><dt>עוצמה</dt><dd>${flow}</dd><dt>תסמינים</dt><dd>${esc((p.symptoms || []).join(', ') || '—')}</dd></dl>
      ${p.notes ? `<p class="muted" style="white-space:pre-wrap">${esc(p.notes)}</p>` : ''}
      <div class="section-label">מעקב הלכתי</div>
      <dl class="kv"><dt>עונת הווסת</dt><dd>${v.known ? onahLabel(v.onah) : 'לא ידועה'}<small>${esc(E.hebStr(v.hdate))}</small></dd><dt>הפסק טהרה</dt><dd>${st.hefsek ? dual(st.hefsek.date) : '—'}</dd>
      ${st.hefsek ? [1, 2, 3, 4, 5, 6, 7].map(k => `<dt>יום ${k}</dt><dd>${days[k] && days[k].done ? 'הושלם' : '—'}${days[k] && days[k].note ? `<small>${esc(days[k].note)}</small>` : ''}</dd>`).join('') : ''}
      <dt>טבילה</dt><dd>${st.hefsek ? (st.tevilaDone ? dual(st.tevilaActual || st.tevilaPlanned) + '<small>בוצעה</small>' : dual(st.tevilaPlanned) + '<small>מתוכננת</small>') : '—'}</dd></dl>
      ${on.length ? `<div class="section-label">עונות שנגזרו מווסת זו</div>${on.map(o => `<div class="faint" style="padding:4px 0">${esc(o.label)}: ${o.hdate ? esc(E.hebStr(o.hdate, { year: false })) + ' · ' + onahLabel(o.onah) : esc(o.info)}</div>`).join('')}` : ''}
      <div class="btn-row" style="margin-top:18px"><button class="btn sm" data-act="period-edit" data-id="${p.id}">${I.edit} עריכה</button><button class="btn sm ghost" data-act="tahara-goto" data-id="${p.id}">מעבר לטהרה</button></div>`);
  }

  /* ================= REMINDERS ================= */
  const REM_LABELS = { period: ['תחילת מחזור צפויה', 'הערכה'], hefsek: ['הפסק טהרה', 'במועד המוקדם לפי ההגדרות'], shiva: ['בדיקות שבעה נקיים', 'בכל אחד מימי הספירה'], tevila: ['יום טבילה', ''], fertile: ['חלון פוריות', 'הערכה'], ovulation: ['יום ביוץ משוער', 'הערכה'], lh: ['בדיקת ביוץ', '3 ימים לפני הביוץ המשוער ועד יום הביוץ'], onot: ['עונות פרישה', 'לפי ההגדרות האישיות'] };
  function viewReminders() {
    const s = state.settings; const up = E.upcomingReminders(state, T(), 30);
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    return top('תזכורות', 'כל תזכורת נדלקת ונכבית בנפרד') + `
    <div class="card">${Object.entries(REM_LABELS).map(([k, [l, sub]]) => `<div class="list-row"><div><div class="t">${l}</div><div class="s">${sub}${sub ? ' · ' : ''}<select data-rem-before="${k}" style="border:0;background:none;color:var(--rose-deep);font-weight:600;padding:0">${[0, 1, 2, 3].map(n => `<option value="${n}" ${+s.reminders[k].before === n ? 'selected' : ''}>${n === 0 ? 'ביום עצמו' : n === 1 ? 'יום לפני' : n + ' ימים לפני'}</option>`).join('')}</select></div></div><label class="switch"><input type="checkbox" data-rem-on="${k}" ${s.reminders[k].on ? 'checked' : ''}><span></span></label></div>`).join('')}
      <div class="list-row"><div><div class="t">שעת התראה</div><div class="s">שעה ביום שבה תוצג ההתראה</div></div><input type="time" class="input" style="width:auto;min-height:40px" value="${esc(s.reminderTime)}" data-set="reminderTime"></div>
    </div>
    <div class="section-label">התראות</div>
    <div class="card"><p class="muted" style="margin:0 0 10px">${perm === 'granted' ? 'ההתראות פעילות. הן מוצגות כשהאפליקציה פתוחה או נפתחת.' : perm === 'denied' ? 'ההתראות חסומות בדפדפן. אפשר להפעיל אותן בהגדרות המכשיר.' : perm === 'unsupported' ? 'הדפדפן הזה לא תומך בהתראות. התזכורות מוצגות במסך הבית.' : 'אפשר להפעיל התראות במכשיר הזה.'}</p>
      <div class="btn-row">${perm === 'default' ? '<button class="btn sm" data-act="notif-enable">הפעלת התראות</button>' : ''}<button class="btn sm ghost" data-act="ics">${I.cal} הוספה ליומן הטלפון (‎.ics)</button></div>
      <p class="faint" style="margin:10px 0 0">אפליקציה שאין לה שרת לא יכולה לשלוח התראה כשהיא סגורה. כדי לקבל התראות גם כשהאפליקציה סגורה, אפשר לייבא את התזכורות ליומן של הטלפון בעזרת קובץ ‎.ics, שיוצר אירועים עם התראה. כדאי לעשות זאת שוב אחרי כל מחזור. כותרות האירועים ביומן כלליות ודיסקרטיות.</p></div>
    <div class="section-label">ב-30 הימים הקרובים</div>
    <div class="card">${up.length ? up.map(r => `<div class="list-row"><div><div class="t">${esc(r.title)}</div><div class="s">${esc(E.gregStr(r.date, { weekday: true, year: false }))} · ${esc(E.hebStr(r.date, { year: false }))}${r.detail ? ' · ' + esc(r.detail) : ''}</div></div><span class="pill-days">${rel(E.diffDays(T(), r.date))}</span></div>`).join('') : '<p class="faint">אין תזכורות פעילות בטווח הזה.</p>'}</div>`;
  }
  function checkNotifications() {
    if (!state || !state.onboarded || !('Notification' in window) || Notification.permission !== 'granted') return;
    const now = E.nowJerusalem(); const at = E.parseHM(state.settings.reminderTime) ?? 480;
    const due = E.upcomingReminders(state, now.date, 3).filter(r => r.notify < now.date || (r.notify === now.date && now.minutes >= at));
    let changed = false;
    due.forEach(r => {
      if (state.notified[r.id]) return;
      state.notified[r.id] = now.date; changed = true;
      const body = `${E.gregStr(r.date, { weekday: true, year: false })}${r.detail ? ' · ' + r.detail : ''}`;
      if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.ready.then(reg => reg.showNotification('TAHARA · ' + r.title, { body, icon: 'icons/icon-192.png', tag: r.id, lang: 'he', dir: 'rtl' }));
      else try { new Notification('TAHARA · ' + r.title, { body, tag: r.id }); } catch (e) { /* ignore */ }
    });
    // prune old keys
    for (const k of Object.keys(state.notified)) if (E.diffDays(state.notified[k], now.date) > 60) { delete state.notified[k]; changed = true; }
    if (changed) save();
  }
  function exportICS() {
    const up = E.upcomingReminders(state, T(), 90);
    if (!up.length) return toast('אין תזכורות פעילות לייצוא');
    const at = (state.settings.reminderTime || '08:00').replace(':', '') + '00';
    const discreet = { period: 'תזכורת אישית', hefsek: 'תזכורת אישית', shiva: 'תזכורת אישית', tevila: 'תזכורת אישית', fertile: 'תזכורת אישית', ovulation: 'תזכורת אישית', lh: 'תזכורת אישית', onot: 'תזכורת אישית' };
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TAHARA//HE', 'CALSCALE:GREGORIAN'];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    up.forEach(r => {
      const d = r.notify.replace(/-/g, '');
      lines.push('BEGIN:VEVENT', `UID:${r.id.replace(/[^\w:-]/g, '')}-${d}@tahara.local`, `DTSTAMP:${stamp}`, `DTSTART;TZID=Asia/Jerusalem:${d}T${at}`, 'DURATION:PT15M', `SUMMARY:${discreet[r.key]} (T)`, 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:תזכורת', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    download(new Blob([lines.join('\r\n')], { type: 'text/calendar' }), 'tahara-reminders.ics');
  }

  /* ================= SETTINGS ================= */
  function viewSettings() {
    const s = state.settings;
    const num = (key, label, min, max, hint) => `<div class="field"><label>${label}</label><input class="input" type="number" min="${min}" max="${max}" inputmode="numeric" value="${esc(s[key])}" data-set="${key}" data-num>${hint ? `<small>${hint}</small>` : ''}</div>`;
    const tog = (path, label, sub) => { const v = path.split('.').reduce((o, k) => o[k], s); return `<div class="list-row"><div><div class="t">${label}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div><label class="switch"><input type="checkbox" data-set="${path}" data-bool ${v ? 'checked' : ''}><span></span></label></div>`; };
    return top('הגדרות ופרטיות') + `
    <div class="section-label" style="margin-top:6px">מעקב רפואי ותחזיות</div>
    <div class="card"><div class="row2">${num('cycleLength', 'אורך מחזור התחלתי', 18, 45, 'משמש כל עוד אין 2 מחזורים')}${num('bleedDays', 'ימי דימום התחלתיים', 1, 12)}</div>
      <div class="row2">${num('luteal', 'שלב לוטאלי (ימים)', 10, 17, 'ביוץ = מחזור צפוי פחות ערך זה')}${num('avgWindow', 'מחזורים לחישוב ממוצע', 2, 24)}</div>
      <div class="row2">${num('fertileBefore', 'ימי פוריות לפני ביוץ', 1, 7)}${num('fertileAfter', 'ימי פוריות אחרי ביוץ', 0, 3)}</div>
      ${tog('useLH', 'שימוש בבדיקת ביוץ חיובית', 'אם תועדה בדיקה חיובית במחזור, הביוץ המשוער יחושב לפיה')}</div>

    <div class="section-label">הגדרות הלכתיות אישיות</div>
    <div class="card">
      <div class="field"><label>ימים מתחילת הווסת עד הפסק טהרה מוקדם</label><select class="input" data-set="minHefsekDays" data-num>${[[5, '5 ימים (מנהג אשכנז)'], [4, '4 ימים (מנהג ספרד)'], [6, '6 ימים'], [7, '7 ימים']].map(([v, l]) => `<option value="${v}" ${+s.minHefsekDays === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>מיקום (לחישוב זריחה ושקיעה)</label><select class="input" data-set="city">${Object.entries(E.CITIES).map(([k, c]) => `<option value="${k}" ${s.city === k ? 'selected' : ''}>${c.name}</option>`).join('')}<option value="custom" ${s.city === 'custom' ? 'selected' : ''}>מיקום מותאם אישית</option></select></div>
      ${s.city === 'custom' ? `<div class="row2"><div class="field"><label>קו רוחב</label><input class="input" type="number" step="0.001" value="${s.lat}" data-set="lat" data-num></div><div class="field"><label>קו אורך</label><input class="input" type="number" step="0.001" value="${s.lon}" data-set="lon" data-num></div></div>` : ''}
      <div class="faint" style="margin:-4px 0 10px">היום: זריחה ~${E.hm(E.sunTimes(T(), s.lat, s.lon).sunrise)} · שקיעה ~${E.hm(E.sunTimes(T(), s.lat, s.lon).sunset)}. החישוב האסטרונומי משוער, ובמקרה גבולי יש לבדוק בלוח זמנים מוסמך.</div>
      <div class="section-label" style="margin-top:10px">חישובי עונות</div>
      ${tog('onot.haflagah', 'עונת ההפלגה', 'לפי המרווח בין שתי הווסתות האחרונות')}
      ${tog('onot.chodesh', 'וסת החודש', 'אותו תאריך עברי בחודש הבא')}
      ${tog('onot.beinonit', 'עונה בינונית', 'היום ה-30 מתחילת הווסת')}
      ${tog('onot.beinonit31', 'גם יום 31', 'לנוהגים כך')}
      ${tog('onot.beinonitFull', 'עונה בינונית מעת לעת', 'יום ולילה במקום העונה של הווסת בלבד')}
      ${tog('onot.ohrZarua', 'עונת אור זרוע', 'גם העונה שלפני כל עונה מחושבת')}
      ${tog('onot.oldHaflagot', 'הפלגות קודמות שלא נעקרו', 'הפלגה ארוכה יותר שעדיין לא עברה בלי ראייה')}
      <div class="field" style="margin-top:12px"><label>הערות והנחיות שקיבלתי מהרב או מהיועצת</label><textarea class="input" data-set="rabbiNote">${esc(s.rabbiNote || '')}</textarea></div>
      ${disclaimerHal}
    </div>

    <div class="section-label">תצוגה</div>
    <div class="card">
      <div class="field"><span class="lbl">הצגת תאריכים</span><div class="seg" data-seg-set="dateMode">${[['both', 'לועזי + עברי'], ['heb', 'עברי תחילה'], ['greg', 'לועזי בלבד']].map(([v, l]) => `<button data-val="${v}" class="${s.dateMode === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">ערכת צבעים</span><div class="seg" data-seg-set="theme">${[['auto', 'אוטומטי'], ['light', 'בהיר'], ['dark', 'כהה']].map(([v, l]) => `<button data-val="${v}" class="${s.theme === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">פריטי ברירת מחדל ברשימת ההכנות לטבילה</span><textarea class="input" data-set="checklist" data-lines>${esc(s.checklist.join('\n'))}</textarea><small>פריט אחד בכל שורה. הרשימה תשמש במחזורים חדשים.</small></div>
    </div>

    <div class="section-label">פרטיות ואבטחה</div>
    <div class="card">
      <div class="note" style="margin-bottom:12px">${I.shield.replace('<svg', '<svg style="width:16px;height:16px;vertical-align:-3px;margin-left:4px"')} כל המידע נשמר אך ורק במכשיר הזה. האפליקציה אינה שולחת מידע לשום שרת, ואינה משתמשת בשירותי צד שלישי, בפונטים חיצוניים או בכלי מעקב.</div>
      <div class="list-row"><div><div class="t">נעילה בקוד אישי</div><div class="s">${state.pinEnabled ? 'פעילה. הנתונים מוצפנים (AES-256).' : 'כבויה'}</div></div><button class="btn sm ${state.pinEnabled ? 'ghost' : ''}" data-act="${state.pinEnabled ? 'pin-off' : 'pin-on'}">${state.pinEnabled ? 'ביטול' : 'הפעלה'}</button></div>
      ${state.pinEnabled ? `<div class="list-row"><div class="t">החלפת קוד</div><button class="btn sm ghost" data-act="pin-change">החלפה</button></div><div class="list-row"><div><div class="t">נעילה אוטומטית</div><div class="s">כשהאפליקציה ברקע</div></div><select class="input" style="width:auto;min-height:40px" data-set="autoLockMin" data-num>${[[0, 'מיד'], [1, 'אחרי דקה'], [3, 'אחרי 3 דקות'], [10, 'אחרי 10 דקות']].map(([v, l]) => `<option value="${v}" ${+s.autoLockMin === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>` : ''}
    </div>

    <div class="section-label">ייצוא, גיבוי ושחזור</div>
    <div class="card">
      <div class="btn-row">
        <button class="btn sm ghost" data-act="export-xlsx">${I.file} ייצוא ל-Excel</button>
        <button class="btn sm ghost" data-act="export-pdf">${I.file} ייצוא ל-PDF / הדפסה</button>
        <button class="btn sm ghost" data-act="backup">${I.download} גיבוי מלא</button>
        <button class="btn sm ghost" data-act="restore">${I.upload} שחזור מגיבוי</button>
      </div>
      <p class="faint" style="margin:10px 0 0">הגיבוי הוא קובץ JSON שמכיל את כל הנתונים וההגדרות. כשנעילה פעילה, הקובץ מוצפן בקוד שלך. שמרי אותו במקום בטוח. ${state.lastBackup ? 'גיבוי אחרון: ' + esc(E.gregStr(state.lastBackup)) : 'עדיין לא בוצע גיבוי.'}</p>
    </div>
    <div class="section-label">אזור רגיש</div>
    <div class="card"><button class="btn block danger" data-act="wipe">${I.trash} מחיקת כל הנתונים</button></div>
    <p class="faint" style="text-align:center;margin:20px 0">TAHARA · גרסה 1.0 · אזור זמן: ירושלים</p>`;
  }
  function setSetting(path, val) {
    const keys = path.split('.'); let o = state.settings;
    for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
    o[keys[keys.length - 1]] = val;
    if (path === 'city' && E.CITIES[val]) { state.settings.lat = E.CITIES[val].lat; state.settings.lon = E.CITIES[val].lon; }
    save();
  }

  /* ================= export ================= */
  function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function crc32(buf) { let c, crc = 0xFFFFFFFF; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xFF; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    const enc = new TextEncoder(); const parts = []; const central = []; let offset = 0;
    files.forEach(f => {
      const name = enc.encode(f.name); const data = enc.encode(f.data); const crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    });
    const cdSize = central.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function xmlEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); }
  function sheetXml(rows) {
    const col = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews><sheetData>${rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => typeof v === 'number' ? `<c r="${col(ci)}${ri + 1}"><v>${v}</v></c>` : `<c r="${col(ci)}${ri + 1}" t="inlineStr"${ri === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
  }
  function exportXLSX() {
    const ps = E.sortedPeriods(state); const cyc = E.cycles(state); const hf = E.haflagot(state);
    const flow = { light: 'קל', medium: 'בינוני', heavy: 'חזק' };
    const s1 = [['תאריך תחילה', 'תאריך עברי', 'שעה', 'עונה', 'סיום דימום', 'ימי דימום', 'עוצמה', 'תסמינים', 'אורך מחזור', 'הפלגה', 'הערות']].concat(ps.map(p => { const c = cyc.find(x => x.from.id === p.id); const h = hf.find(x => x.to.id === p.id); const v = E.vesetOnah(p, state.settings); return [p.start, E.hebStr(p.start), p.time || '', v.known ? onahLabel(v.onah) : 'לא ידוע', p.end || '', E.bleedLength(p) || '', flow[p.flow] || '', (p.symptoms || []).join(', '), c ? c.length : '', h ? h.length : '', p.notes || '']; }));
    const s2 = [['מחזור', 'הפסק טהרה', 'שעת הפסק', 'יום 1', 'יום 2', 'יום 3', 'יום 4', 'יום 5', 'יום 6', 'יום 7', 'טבילה מתוכננת', 'טבילה בפועל', 'בוצעה', 'הערות']].concat(ps.map(p => { const st = E.taharaStatus(state, p); const d = (p.tahara && p.tahara.days) || {}; const tv = (p.tahara && p.tahara.tevila) || {}; return [p.start, st.hefsek ? st.hefsek.date : '', st.hefsek ? st.hefsek.time || '' : ''].concat([1, 2, 3, 4, 5, 6, 7].map(k => d[k] ? [d[k].done ? 'הושלם' : '', d[k].am === 'question' || d[k].pm === 'question' ? 'לבירור' : '', d[k].note || ''].filter(Boolean).join(' | ') : '')).concat([st.hefsek ? st.tevilaPlanned : '', tv.actual || '', tv.done ? 'כן' : '', tv.notes || '']); }));
    const s3 = [['מווסת', 'עד וסת', 'תאריך עברי', 'אורך הפלגה']].concat(hf.map(h => [h.from.start, h.to.start, E.hebStr(h.toH), h.length]));
    const s4 = [['תאריך', 'בדיקת ביוץ', 'חום בסיסי', 'הפרשות', 'כאבי ביוץ', 'תסמינים', 'הערות']].concat((state.ovLogs || []).slice().sort((a, b) => E.cmp(a.date, b.date)).map(l => [l.date, l.lh === 'pos' ? 'חיובית' : l.lh === 'neg' ? 'שלילית' : '', l.bbt ? +l.bbt : '', l.mucus || '', l.pain ? 'כן' : '', (l.symptoms || []).join(', '), l.notes || '']));
    const names = ['מחזורים', 'טהרה', 'הפלגות', 'פוריות'];
    const sheets = [s1, s2, s3, s4];
    const files = [
      { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
      { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
      { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((n, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${names.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: 'xl/styles.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0"/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>` }
    ].concat(sheets.map((r, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(r) })));
    download(zip(files), `tahara-${T()}.xlsx`); toast('קובץ Excel נוצר');
  }
  function exportPDF() {
    const ps = E.sortedPeriods(state); const cyc = E.cycles(state); const hf = E.haflagot(state); const st = E.stats(state, 0);
    $('#print-area').innerHTML = `<h1>TAHARA – דוח אישי</h1><div>הופק: ${esc(E.gregStr(T()))} · ${esc(E.hebStr(T()))}</div>
      <h2>סיכום</h2><table><tr><th>מחזורים</th><td>${ps.length}</td><th>אורך מחזור ממוצע</th><td>${fmt1(st.avgCycle)}</td><th>ממוצע ימי דימום</th><td>${fmt1(st.avgBleed)}</td><th>ממוצע הפלגה</th><td>${fmt1(st.avgHaflagah)}</td></tr></table>
      <h2>מחזורים</h2><table><thead><tr><th>תחילה</th><th>עברי</th><th>שעה</th><th>סיום</th><th>ימי דימום</th><th>מחזור</th><th>הפלגה</th><th>הפסק</th><th>טבילה</th><th>הערות</th></tr></thead><tbody>
      ${ps.map(p => { const c = cyc.find(x => x.from.id === p.id); const h = hf.find(x => x.to.id === p.id); const s = E.taharaStatus(state, p); return `<tr><td>${E.gregShort(p.start)}</td><td>${esc(E.hebStr(p.start))}</td><td>${esc(p.time || '')}</td><td>${p.end ? E.gregShort(p.end) : ''}</td><td>${E.bleedLength(p) || ''}</td><td>${c ? c.length : ''}</td><td>${h ? h.length : ''}</td><td>${s.hefsek ? E.gregShort(s.hefsek.date) : ''}</td><td>${s.hefsek ? E.gregShort(s.tevilaActual || s.tevilaPlanned) + (s.tevilaDone ? ' ✓' : '') : ''}</td><td>${esc(p.notes || '')}</td></tr>`; }).join('')}</tbody></table>
      <h2>עונות קרובות (חישוב טכני)</h2><table><tbody>${E.currentOnot(state).map(o => `<tr><td>${esc(o.label)}</td><td>${o.hdate ? esc(E.hebStr(o.hdate)) + ' · ' + E.gregShort(o.hdate) : esc(o.info)}</td><td>${o.window ? esc(onahLabel(o.onah) + ' · ' + o.window.text) : ''}</td></tr>`).join('')}</tbody></table>
      <p style="margin-top:16px;font-size:10px">החישובים ההלכתיים הם כלי עזר טכני בלבד ואינם פסק הלכה. התחזיות הרפואיות הן הערכה בלבד.</p>`;
    setTimeout(() => window.print(), 50);
  }
  async function backup() {
    let payload;
    if (state.pinEnabled && cryptoKey) payload = JSON.stringify({ app: 'TAHARA', encrypted: true, data: JSON.parse(await encryptState(cryptoKey, encSalt)) });
    else payload = JSON.stringify({ app: 'TAHARA', encrypted: false, data: state }, null, 1);
    state.lastBackup = T(); save();
    download(new Blob([payload], { type: 'application/json' }), `tahara-backup-${T()}.json`); toast('קובץ הגיבוי נוצר'); render();
  }
  async function restoreFile(file) {
    try {
      const obj = JSON.parse(await file.text());
      if (!obj || obj.app !== 'TAHARA') throw new Error('bad');
      let data;
      if (obj.encrypted) {
        const pin = prompt('הקובץ מוצפן. הזיני את הקוד שהיה פעיל בזמן הגיבוי:'); if (!pin) return;
        const key = await deriveKey(pin, b64.dec(obj.data.salt));
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(obj.data.iv) }, key, b64.dec(obj.data.ct));
        data = JSON.parse(new TextDecoder().decode(pt));
      } else data = obj.data;
      confirmSheet('שחזור מגיבוי', `הנתונים הנוכחיים במכשיר יוחלפו בנתוני הגיבוי (${(data.periods || []).length} מחזורים). להמשיך?`, 'שחזור', async () => {
        const keepPin = state.pinEnabled;
        state = normalize(data); state.pinEnabled = keepPin && !!cryptoKey; state.onboarded = true;
        await save(true); render(); toast('הנתונים שוחזרו');
      });
    } catch (e) { toast('לא ניתן לקרוא את הקובץ, או שהקוד שגוי'); }
  }

  /* ================= PIN / lock ================= */
  let pinBuf = ''; let pinMode = null; let pinFirst = '';
  function showLock(mode) {
    pinMode = mode; pinBuf = ''; pinFirst = '';
    const el = $('#lock'); el.classList.remove('hidden');
    $('#app').setAttribute('aria-hidden', 'true');
    drawLock();
  }
  function drawLock(msg) {
    const titles = { unlock: 'הזיני קוד', set: 'בחרי קוד בן 4–6 ספרות', confirm: 'הזיני שוב את הקוד', change: 'בחרי קוד חדש' };
    $('#lock').innerHTML = `<div style="width:64px;height:64px;margin-bottom:10px">${I.logo}</div><h1>TAHARA</h1><p class="muted" style="margin:0">${msg ? esc(msg) : titles[pinMode]}</p>
      <div class="pin-dots" id="pin-dots">${[0, 1, 2, 3, 4, 5].map(i => `<i class="${i < pinBuf.length ? 'on' : ''}" ${i >= 4 && pinBuf.length <= 4 && i >= Math.max(4, pinBuf.length) ? 'style="opacity:.35"' : ''}></i>`).join('')}</div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-pin="${n}">${n}</button>`).join('')}<button data-pin="cancel" style="font-size:14px">${pinMode === 'unlock' ? '' : 'ביטול'}</button><button data-pin="0">0</button><button data-pin="ok" style="font-size:15px;font-weight:600">אישור</button></div>
      ${pinMode === 'unlock' ? `<button class="link-btn" style="margin-top:24px" data-pin="forgot">שכחתי את הקוד</button>` : ''}`;
  }
  async function pinKey(k) {
    if (k === 'forgot') {
      if (confirm('בלי הקוד אי אפשר לפענח את הנתונים המוצפנים. אם יש לך קובץ גיבוי לא מוצפן, תוכלי לשחזר ממנו אחרי האיפוס.\n\nלמחוק את כל הנתונים במכשיר ולהתחיל מחדש?')) { ls.del(KEY_ENC); ls.del(KEY_PLAIN); location.reload(); }
      return;
    }
    if (k === 'cancel') { if (pinMode !== 'unlock') { $('#lock').classList.add('hidden'); $('#app').removeAttribute('aria-hidden'); } return; }
    if (k === 'ok') return pinSubmit();
    if (pinBuf.length >= 6) return;
    pinBuf += k; drawLock();
    if (pinMode === 'unlock' && pinBuf.length >= 4) tryUnlock(true);
  }
  function shake(msg) { pinBuf = ''; drawLock(msg); const d = $('#pin-dots'); d.classList.add('shake'); }
  async function tryUnlock(silent) {
    try {
      const raw = JSON.parse(ls.get(KEY_ENC));
      const salt = b64.dec(raw.salt); const key = await deriveKey(pinBuf, salt);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(raw.iv) }, key, b64.dec(raw.ct));
      state = normalize(JSON.parse(new TextDecoder().decode(pt))); cryptoKey = key; encSalt = salt;
      $('#lock').classList.add('hidden'); $('#app').removeAttribute('aria-hidden'); lastActive = Date.now(); render(); checkNotifications();
    } catch (e) { if (!silent || pinBuf.length >= 6) shake('קוד שגוי'); }
  }
  async function pinSubmit() {
    if (pinMode === 'unlock') return tryUnlock(false);
    if (pinBuf.length < 4) return shake('הקוד צריך לכלול 4 ספרות לפחות');
    if (pinMode === 'set' || pinMode === 'change') { pinFirst = pinBuf; pinBuf = ''; pinMode = 'confirm'; return drawLock(); }
    if (pinMode === 'confirm') {
      if (pinBuf !== pinFirst) { pinMode = 'set'; return shake('הקודים אינם תואמים. נסי שוב'); }
      encSalt = crypto.getRandomValues(new Uint8Array(16)); cryptoKey = await deriveKey(pinBuf, encSalt);
      state.pinEnabled = true; await save(true);
      $('#lock').classList.add('hidden'); $('#app').removeAttribute('aria-hidden'); render(); toast('הנעילה הופעלה והנתונים הוצפנו');
    }
  }
  function lockNow() { if (!state.pinEnabled) { toast('כדי לנעול, הפעילי קוד אישי בהגדרות'); location.hash = 'settings'; return; } save(true).then(() => { state = null; cryptoKey = null; closeSheet(); $('#view').innerHTML = ''; showLock('unlock'); }); }

  /* ================= sheet helpers ================= */
  function openSheet(html) {
    const sh = $('#sheet'), ov = $('#overlay');
    sh.innerHTML = `<div class="grab"></div>${html}`; sh.classList.remove('hidden'); ov.classList.remove('hidden');
    requestAnimationFrame(() => { sh.classList.add('show'); ov.classList.add('show'); });
    sh.scrollTop = 0;
  }
  function closeSheet() {
    const sh = $('#sheet'), ov = $('#overlay');
    sh.classList.remove('show'); ov.classList.remove('show');
    setTimeout(() => { sh.classList.add('hidden'); ov.classList.add('hidden'); sh.innerHTML = ''; }, 280);
  }
  let confirmCb = null;
  function confirmSheet(title, text, okLabel, cb, danger) {
    confirmCb = cb;
    openSheet(`<h3>${esc(title)}</h3><p class="muted">${esc(text)}</p><div class="btn-row" style="margin-top:18px"><button class="btn ${danger ? 'danger' : ''}" data-act="confirm-ok">${esc(okLabel)}</button><button class="btn ghost" data-act="sheet-close">ביטול</button></div>`);
  }

  /* ================= event handling ================= */
  document.addEventListener('click', e => {
    const pk = e.target.closest('[data-pin]'); if (pk) { pinKey(pk.dataset.pin); return; }
    const go = e.target.closest('[data-go]'); if (go && !e.target.closest('[data-act]')) { location.hash = go.dataset.go; return; }
    const segBtn = e.target.closest('[data-seg] button');
    if (segBtn) { const seg = segBtn.parentElement; seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === segBtn)); const f = seg.closest('form'); f[seg.dataset.seg].value = segBtn.dataset.val; return; }
    const segSet = e.target.closest('[data-seg-set] button');
    if (segSet) { setSetting(segSet.parentElement.dataset.segSet, segSet.dataset.val); render(); return; }
    const chip = e.target.closest('[data-chips] .chip'); if (chip) { chip.classList.toggle('on'); return; }
    const el = e.target.closest('[data-act]'); if (!el) { if (e.target.id === 'overlay') closeSheet(); return; }
    const a = el.dataset.act; const id = el.dataset.id;
    const p = id ? findPeriod(id) : null;
    switch (a) {
      case 'period-new': periodForm(el.dataset.date ? { start: el.dataset.date, onahMode: 'auto', symptoms: [] } : null); break;
      case 'period-edit': periodForm(p); break;
      case 'period-delete': confirmSheet('מחיקת מחזור', `למחוק את המחזור מ-${E.gregStr(p.start)} כולל נתוני ההפסק, שבעה נקיים והטבילה שלו? לא ניתן לבטל פעולה זו.`, 'מחיקה', () => { state.periods = state.periods.filter(x => x.id !== id); if (ui.taharaPeriod === id) ui.taharaPeriod = null; commit('המחזור נמחק'); }, true); break;
      case 'history-open': historySheet(p); break;
      case 'tahara-goto': ui.taharaPeriod = id; closeSheet(); location.hash = 'tahara'; break;
      case 'hefsek-open': hefsekForm(p); break;
      case 'hefsek-reset': confirmSheet('התחלת ספירה מחדש', 'ההפסק, סימוני שבעה נקיים ותאריך הטבילה של המחזור הזה יימחקו, ותוכלי לרשום הפסק חדש.', 'איפוס', () => { p.tahara.hefsek = null; p.tahara.days = {}; p.tahara.tevila = Object.assign(p.tahara.tevila || {}, { override: '', actual: '', done: false }); closeSheet(); commit('הספירה אופסה'); }, true); break;
      case 'shiva-day': shivaSheet(p, +el.dataset.k); break;
      case 'tevila-toggle': { const tv = p.tahara.tevila; tv.done = !tv.done; if (tv.done && !tv.actual) tv.actual = E.taharaStatus(state, p).tevilaPlanned; commit(tv.done ? 'הטבילה סומנה כבוצעה' : 'הסימון בוטל'); break; }
      case 'tevila-edit': tevilaSheet(p); break;
      case 'check-toggle': { const c = p.tahara.tevila.checklist.find(x => x.id === el.dataset.c); c.done = !c.done; commit(); break; }
      case 'check-del': p.tahara.tevila.checklist = p.tahara.tevila.checklist.filter(x => x.id !== el.dataset.c); commit(); break;
      case 'ov-new': ovForm(null, el.dataset.date); break;
      case 'ov-edit': ovForm(state.ovLogs.find(l => l.id === id)); break;
      case 'ov-delete': state.ovLogs = state.ovLogs.filter(l => l.id !== id); closeSheet(); commit('נמחק'); break;
      case 'cal-day': ui.calSel = el.dataset.date; if (ui.calSel.slice(0, 7) !== ui.calMonth) ui.calMonth = ui.calSel.slice(0, 7); render(); break;
      case 'cal-prev': case 'cal-next': { const [y, m] = ui.calMonth.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + (a === 'cal-next' ? 1 : -1), 1)); ui.calMonth = d.toISOString().slice(0, 7); render(); break; }
      case 'cal-today': ui.calMonth = T().slice(0, 7); ui.calSel = T(); render(); break;
      case 'stats-range': ui.statsRange = +el.dataset.v; render(); break;
      case 'notif-enable': Notification.requestPermission().then(() => { render(); checkNotifications(); }); break;
      case 'ics': exportICS(); break;
      case 'export-xlsx': exportXLSX(); break;
      case 'export-pdf': exportPDF(); break;
      case 'backup': backup(); break;
      case 'restore': $('#restore-file').click(); break;
      case 'wipe': confirmSheet('מחיקת כל הנתונים', 'כל המחזורים, התיעודים וההגדרות יימחקו לצמיתות מהמכשיר הזה. מומלץ לגבות לפני כן. להמשיך?', 'מחיקה לצמיתות', () => { ls.del(KEY_PLAIN); ls.del(KEY_ENC); state = blankState(); cryptoKey = null; closeSheet(); location.hash = ''; render(); toast('כל הנתונים נמחקו'); }, true); break;
      case 'pin-on': showLock('set'); break;
      case 'pin-change': showLock('change'); break;
      case 'pin-off': confirmSheet('ביטול נעילה', 'הנתונים יישמרו במכשיר ללא הצפנה. להמשיך?', 'ביטול נעילה', async () => { state.pinEnabled = false; cryptoKey = null; await save(true); closeSheet(); render(); toast('הנעילה בוטלה'); }); break;
      case 'lock-now': lockNow(); break;
      case 'install': if (installPrompt) { installPrompt.prompt(); installPrompt = null; } break;
      case 'confirm-ok': { const cb = confirmCb; confirmCb = null; closeSheet(); if (cb) cb(); break; }
      case 'sheet-close': closeSheet(); break;
    }
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
    const k = f.dataset.form;
    if (k === 'onboard') {
      const s = state.settings; s.cycleLength = +f.cycleLength.value || 28; s.bleedDays = +f.bleedDays.value || 5; s.minHefsekDays = +f.minHefsekDays.value; s.city = f.city.value; s.lat = E.CITIES[s.city].lat; s.lon = E.CITIES[s.city].lon;
      state.onboarded = true; save(); location.hash = 'home'; render(); setTimeout(() => periodForm(), 350);
    } else if (k === 'period') submitPeriod(f);
    else if (k === 'hefsek') submitHefsek(f);
    else if (k === 'shiva') {
      const p = findPeriod(f.dataset.id); p.tahara.days = p.tahara.days || {};
      p.tahara.days[f.dataset.k] = { am: f.am.value, pm: f.pm.value, done: f.done.checked, remind: f.remind.checked, note: f.note.value.trim() };
      closeSheet(); commit('נשמר');
    } else if (k === 'tevila') {
      const p = findPeriod(f.dataset.id); const tv = p.tahara.tevila = p.tahara.tevila || {}; const st = E.taharaStatus(state, p);
      tv.override = f.override.value && f.override.value !== st.day7 ? f.override.value : '';
      tv.actual = f.actual.value; tv.done = f.done.checked; tv.notes = f.notes.value.trim();
      if (tv.done && !tv.actual) tv.actual = tv.override || st.day7;
      closeSheet(); commit('נשמר');
    } else if (k === 'check-add') {
      const v = f.text.value.trim(); if (!v) return; const p = findPeriod(f.dataset.id);
      p.tahara.tevila.checklist.push({ id: uid(), text: v, done: false }); commit();
    } else if (k === 'ov') submitOv(f);
  });
  document.addEventListener('input', e => {
    if (e.target.matches('[data-heb]')) hebHints();
    const f = e.target.form;
    if (f && f.dataset.form === 'period') {
      if (e.target.name === 'end' && E.isDate(f.end.value) && E.isDate(f.start.value) && f.end.value >= f.start.value) f.bleedDays.value = E.diffDays(f.start.value, f.end.value) + 1;
      if (e.target.name === 'bleedDays' && f.bleedDays.value && E.isDate(f.start.value)) f.end.value = E.addDays(f.start.value, +f.bleedDays.value - 1);
      updateOnahPreview(); hebHints();
    }
    if (f && f.dataset.form === 'hefsek') sunsetHint();
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.actChange === 'cal-jump' && t.value) { ui.calMonth = t.value; render(); return; }
    if (t.dataset.actChange === 'tahara-period') { ui.taharaPeriod = t.value; render(); return; }
    if (t.id === 'restore-file' && t.files[0]) { restoreFile(t.files[0]); t.value = ''; return; }
    if (t.dataset.remOn) { state.settings.reminders[t.dataset.remOn].on = t.checked; save(); render(); return; }
    if (t.dataset.remBefore) { state.settings.reminders[t.dataset.remBefore].before = +t.value; save(); render(); return; }
    if (t.dataset.set) {
      let v = t.value;
      if ('bool' in t.dataset) v = t.checked;
      else if ('num' in t.dataset) { v = parseFloat(v); if (isNaN(v)) return toast('ערך לא תקין'); if (t.min && v < +t.min) v = +t.min; if (t.max && v > +t.max) v = +t.max; }
      else if ('lines' in t.dataset) v = v.split('\n').map(x => x.trim()).filter(Boolean);
      setSetting(t.dataset.set, v); render(); toast('ההגדרה נשמרה');
    }
  });
  window.addEventListener('hashchange', () => { closeSheet(); render(); window.scrollTo({ top: 0 }); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); if (!$('#lock').classList.contains('hidden') && /^[0-9]$/.test(e.key)) pinKey(e.key); if (!$('#lock').classList.contains('hidden') && e.key === 'Enter') pinKey('ok'); if (!$('#lock').classList.contains('hidden') && e.key === 'Backspace') { pinBuf = pinBuf.slice(0, -1); drawLock(); } });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { lastActive = Date.now(); if (state) save(true); }
    else if (state && state.pinEnabled && cryptoKey && Date.now() - lastActive >= (state.settings.autoLockMin || 0) * 60000) lockNow();
    else if (state) { render(); checkNotifications(); }
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render());

  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });

  /* ================= boot ================= */
  function boot() {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
    setInterval(() => { if (state && !document.hidden) checkNotifications(); }, 60000);
    if (ls.get(KEY_ENC)) { showLock('unlock'); return; }
    let data = null; try { data = JSON.parse(ls.get(KEY_PLAIN)); } catch (e) { data = null; }
    state = normalize(data);
    render(); checkNotifications();
  }
  boot();
})();
