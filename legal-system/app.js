/* מערכת ניהול תיקים · לוגיקה */
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = {
      db: { claims: [], closures: [], seizures: [], tasks: [], judg: [], misc: [], warns: [], agrs: [] },
      page: 'home', owner: 'all', k: 0, dialog: null, edit: null, c360: null, toast: '',
      opened: {}, removed: {}, dismissed: {}, openJ: null, other: {},
      jd: {},
      agCfg: {},
      pays: {},
      payEdit: null, cfgOpen: null, openCase: null, more: false, over: {}, undo: null, movedJ: {}, extraJ: [], extraAgrs: [], extraClaims: [], tabs: {}, jExit: {}, svcExit: {}, agClosed: {}, agNoClose: {}, extraClosures: [], extraTasks: [], caseFilter: 'all', nextNum: 32020,
      cases: [],
      agTask: {}, letter: {},
      autopilot: true,
      log: [{ t: '00:00', m: 'המערכת מוכנה · אפשר לייבא נתונים או להוסיף שורה ראשונה' }],
      rules: { r1: 1, r2: 1, r3: 1, r4: 1, r5: 1, r6: 1, r7: 1, r8: 1, r9: 1, r10: 1, r11: 1, r12: 1, r13: 0, r14: 1, r15: 1 }
    };
  }
  componentDidMount() { this.animate(); }
  componentWillUnmount() { cancelAnimationFrame(this.raf); clearTimeout(this.tt); }
  animate() {
    cancelAnimationFrame(this.raf);
    const t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / 900); this.setState({ k: 1 - Math.pow(1 - p, 3) }); if (p < 1) this.raf = requestAnimationFrame(step); };
    this.raf = requestAnimationFrame(step);
  }
  say(msg, undo) {
    clearTimeout(this.tt);
    const n = new Date(), t = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
    this.setState({ toast: msg, undo: undo || null, log: [{ t, m: msg }].concat(this.state.log).slice(0, 6) });
    this.tt = setTimeout(() => this.setState({ toast: '', undo: null }), undo ? 5000 : 2800);
  }
  go(page) { this.setState({ page, owner: 'all' }); if (page === 'home') this.animate(); }
  setCfg(id, patch) { this.setState({ agCfg: { ...this.state.agCfg, [id]: { ...(this.state.agCfg[id] || {}), ...patch } } }); }
  setJ(id, patch) { this.setState({ jd: { ...this.state.jd, [id]: { ...this.state.jd[id], ...patch } } }); }
  data() {
    const O = ['מיכל', 'שחר', 'יפעת', 'מיראל', 'גבריאלה', 'דבורי'];
    const REV = O.map((o) => 'בבדיקה אצל ' + o);
    return {
      owners: O,
      statuses: {
        claims: ['מחכה למסירה', 'בהמתנה', 'ניתן להכין', 'בטיפול', 'מחכה לחלוף המועד'].concat(REV, ['הוגש']),
        seizures: ['בטיפול', 'בבדיקה'].concat(REV, ['הוגש בנט – טרם ניתנה החלטה', 'הוגש']),
        closures: ['בטיפול', 'מחכה לדיבידנד'].concat(REV, ['מחכה לשכר טרחה', 'הוגש לאבי', 'הושלם']),
        tasks: REV.concat(['בטיפול', 'הושלם']),
        judg: ['בטיפול', 'בהמתנה'].concat(REV, ['הושלם'])
      },
      claims: this.state.db.claims || [],
      seizures: this.state.db.seizures || [],
      closures: this.state.db.closures || [],
      tasks: this.state.db.tasks || [],
      judg: this.state.db.judg || [],
      misc: this.state.db.misc || [],
      warns: this.state.db.warns || [],
      agrs: this.state.db.agrs || [],
      rules: [
        { id: 'r1', title: 'מכתב התראה – הוצל״פ', text: 'עברו 30 יום ממסירת ההתראה ← "ניתן לפתוח תיק" + כפתור. פתיחה ← שורה חדשה בטבלת תיקים, ממתינה לשיוך עו״ד.', src: 'כלל משרדי', v: 0 },
        { id: 'r14', title: 'ניתוב תיק לפי סטטוס', text: 'בטבלת תיקים: סטטוס "תביעה" ← נוצרת שורה בטבלת תביעות; "הסכם" ← נוצר הסכם שממתין להזנת סכום ומועדים.', src: 'כלל משרדי', v: 0 },
        { id: 'r15', title: 'חישוב הסכם ופיגורים', text: 'תשלום חודשי = סכום החוב ÷ מספר החודשים. פיגור = סכום החסר בכל חודש שעבר. תשלום חסר ← שאלה לפתיחת משימה לעו״ד.', src: 'כלל משרדי', v: 0 },
        { id: 'r2', title: 'מכתב התראה – בימ״ש', text: 'עברו 21 יום ממסירת ההתראה ← אותה פעולה.', src: 'כלל משרדי', v: 0 },
        { id: 'r3', title: 'כתב הגנה לא הוגש', text: '60 יום מהמצאת כתב התביעה ← "ניתן להגיש בקשה לפס״ד בהיעדר הגנה" ומשימה לעו״ד המטפלת.', src: 'תקנות סדר הדין האזרחי, התשע״ט-2018 · תקנה 13(א), תקנה 130', v: 1 },
        { id: 'r4', title: 'פסיקתא ← תיק הוצל״פ', text: '30 יום ממסירה אישית של הפסיקתא ← "יש לפתוח תיק הוצל״פ" + כפתור; אחרי פתיחה ← משימה "האם הוגשו לקובי מסמכים".', src: 'כלל משרדי', v: 0 },
        { id: 'r5', title: 'מועד שחל בשבת', text: 'מועד מחושב שנופל בשבת נדחה ליום א׳ ומסומן "הוזז". חגים יתווספו מלוח שנה.', src: 'חוק הפרשנות, התשמ״א-1981 · סעיף 10', v: 1 },
        { id: 'r6', title: 'מועד ערעור מצד שכנגד', text: 'אחרי פסק דין: תזכורת לבדוק אם הוגשה בקשת ביטול או ערעור לפני צעדי גבייה.', src: 'תסד״א 2018 · פרק הערעורים; תקנה 130 (ביטול)', v: 1 },
        { id: 'r7', title: 'התיישנות', text: 'התראה על תיק שמתקרב ל-7 שנים מיום היווצרות העילה (6 חודשים לפני).', src: 'חוק ההתיישנות, התשי״ח-1958 · סעיף 5', v: 1 },
        { id: 'r8', title: 'הוגש בנט – טרם ניתנה החלטה', text: 'עיקול שהוגש בנט ולא סומנה החלטה תוך 7 ימים ← תזכורת "לבדוק בנט".', src: 'כלל משרדי', v: 0 },
        { id: 'r9', title: 'הסכם – חודש חדש', text: 'ב-1 לחודש נפתח החודש לסימון בכל ההסכמים, ומי שלא סומן עד ה-10 מקבל תזכורת.', src: 'כלל משרדי', v: 0 },
        { id: 'r10', title: 'הפרת הסכם', text: 'סימון הפרה ← שאלה לפתיחת משימה לעו״ד ← מכתב הפרה ← מעקב עד קובי.', src: 'כלל משרדי', v: 0 },
        { id: 'r11', title: 'בדיקה תקועה', text: 'פריט "בבדיקה אצל" יותר מ-3 ימי עבודה ← תזכורת לבודקת והצעה להעביר לבודקת פנויה.', src: 'כלל משרדי', v: 0 },
        { id: 'r12', title: 'תביעת בימ״ש הוגשה', text: 'תביעה מסוג בימ״ש שסומנה "הוגש" ← הצעה לפתוח שורה במעקב פסקי דין.', src: 'כלל משרדי', v: 0 },
        { id: 'r13', title: 'כפילות תיק', text: 'אותו מספר תיק בכמה טבלאות ← קישור אוטומטי לתצוגת "תיק 360".', src: 'כלל משרדי', v: 0 }
      ]
    };
  }
  renderVals() {
    const s = this.state, D = this.data(), k = s.k, P = s.page;
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const ago = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };
    const fmt = (d) => String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getFullYear()).slice(2);
    const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const DN = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
    const fmtL = (d) => fmt(d) + ' · יום ' + DN[d.getDay()];
    const daysTo = (d) => Math.round((d - today) / 864e5);
    const plus1 = (d) => { const x = new Date(d); x.setDate(x.getDate() + 1); return x; };
    const daysFrom = (v) => Math.round((today - new Date(v + 'T12:00:00')) / 864e5);
    const shiftSat = (d) => { if (s.rules.r5 && d.getDay() === 6) { const x = new Date(d); x.setDate(x.getDate() + 1); return { d: x, shifted: true }; } return { d, shifted: false }; };
    const tone = (st) => st === 'הוגש' || st === 'הושלם' ? 's-done' : st.indexOf('הוגש בנט') === 0 ? 's-net' : st.indexOf('בבדיקה') === 0 ? 's-review' : (st === 'בטיפול' || st === 'ניתן להכין') ? 's-prog' : (st === 'הוגש לאבי' || st === 'מחכה לשכר טרחה') ? 's-gold' : 's-wait';
    const ov = (r) => ({ ...r, ...(s.over[r.id] || {}) });
    const live = (arr) => arr.filter((r) => !s.removed[r.id]).map(ov);
    const delRow = (id, label) => { this.setState({ removed: { ...s.removed, [id]: true } }); this.say('נמחק: ' + label, id); };
    const claims = live(D.claims.concat(s.extraClaims)), seizures = live(D.seizures), closures = live(D.closures.concat(s.extraClosures)), misc0 = live(D.misc);
    const pendingSvc = claims.filter((r) => r.type === 'בימ״ש' && r.status === 'הוגש' && !s.movedJ[r.id] && !s.svcExit[r.id]);
    const tasks = live(D.tasks.concat(s.extraTasks, pendingSvc.map((r) => ({ id: 'ts' + r.id, num: r.num, name: r.name, desc: 'ממתין למסירה אישית של כתב התביעה · להקליד תאריך כשמתקבל', owner: r.owner, status: 'בטיפול', note: '', auto: 'אוטומציה' }))));
    const cnt = (arr, f) => arr.filter(f).length;
    const isRev = (r) => r.status.indexOf('בבדיקה') === 0;
    const HM = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
    const deadlines = [];
    const sfv = (s.sf || {})[P] || 'all';
    const sfOk = (v) => sfv === 'all' || v === sfv;
    let sfPool = [];
    const open360 = (num) => () => this.setState({ c360: num });
    const CSL = ['חדש – ממתין למסלול', 'מו״מ', 'הסכם', 'חדלות פירעון', 'תביעה', 'סגור'];
    const TYPES = ['הוצל״פ', 'בימ״ש'];
    const edCfg = (table, r, isNew) => {
      r = r || {};
      const K = { claims: 'תביעה', seizures: 'עיקול', closures: 'סגירת חשבון', tasks: 'משימה', judg: 'פסק דין', warns: 'מכתב התראה', agrs: 'הסכם', misc: 'שונות', cases: 'תיק' }[table];
      const st = { claims: D.statuses.claims, seizures: D.statuses.seizures, closures: D.statuses.closures, tasks: D.statuses.tasks, judg: D.statuses.judg, cases: CSL }[table] || [];
      const e = { table, kind: (isNew ? 'הוספת ' : 'עריכת ') + K, isNew: !!isNew, id: r.id || null, num: r.num != null ? r.num : '1614/', name: r.name || '', note: r.note || '', owner: (table === 'agrs' ? r.lawyer : r.owner) || '', ownerField: table === 'agrs' ? 'lawyer' : 'owner', hasOwner: ['warns', 'misc'].indexOf(table) < 0, statuses: table === 'warns' ? [] : st, status: r.status || st[0] || '' };
      if (table === 'claims' || table === 'warns') { e.hasType = true; e.types = TYPES; e.type = r.type || TYPES[0]; }
      if (table === 'claims') { e.hasD1 = true; e.d1Label = 'תאריך הכנה'; e.d1Key = 'prep'; e.d1 = r.prep || ''; }
      if (table === 'warns') { e.hasD1 = true; e.d1Label = 'תאריך שליחת התראה'; e.d1Key = 'sentISO'; e.d1 = r.sentISO || ''; e.hasD2 = true; e.d2Label = 'תאריך מסירת התראה (ממנו סופרים)'; e.d2Key = 'delISO'; e.d2 = r.delISO || ''; }
      if (table === 'judg') { e.hasD1 = true; e.d1Label = 'תאריך מסירת כתב התביעה'; e.d1 = (s.jd[r.id] || {}).servedISO || ''; }
      if (table === 'tasks') { e.hasDesc = true; e.desc = r.desc || ''; }
      return e;
    };

    // warnings
    const warns = live(D.warns).map((w0) => {
      const w = { ...w0, sent: w0.sentISO ? daysFrom(w0.sentISO) : null, del: w0.delISO ? daysFrom(w0.delISO) : null };
      const limit = w.type === 'הוצל״פ' ? 30 : 21;
      const opened = !!s.opened[w.id];
      let status, t, pct = 0, countText, canOpen = false, due = '—', shifted = false;
      if (w.del === null) { status = 'מחכה למסירה'; t = 's-wait'; countText = 'טרם נמסר'; }
      else {
        const sh = shiftSat(ago(w.del - limit)); shifted = sh.shifted; due = fmt(sh.d);
        const left = Math.round((sh.d - today) / 864e5);
        pct = Math.min(1, w.del / limit);
        if (opened) { status = 'נפתח תיק'; t = 's-done'; countText = 'הועבר לטבלת תיקים'; pct = 1; }
        else if (left <= 0) { status = 'ניתן לפתוח תיק'; t = 's-alert'; countText = 'עברו ' + (-left) + ' ימים מהמועד'; canOpen = true; }
        else if (left <= 5) { status = 'מתקרב למועד'; t = 's-prog'; countText = 'נותרו ' + left + ' ימים'; }
        else { status = 'במעקב'; t = 's-review'; countText = 'נותרו ' + left + ' ימים'; }
        if (!opened) deadlines.push({ left, title: 'התראה · ' + w.name, sub: w.type + ' · נמסרה ' + fmt(ago(w.del)), rule: w.type === 'הוצל״פ' ? '30 יום' : '21 יום', page: 'warns' });
      }
      const color = { 's-alert': '#B91C1C', 's-prog': '#0E7490', 's-done': '#0F766E', 's-review': '#1D4ED8', 's-wait': '#94A3B8' }[t];
      const C = 100.5;
      return {
        ...w, status, canOpen, countText, due, shifted, sig: 'sig ' + t,
        sent: w.sent == null ? '—' : fmt(ago(w.sent)), delivered: w.del === null ? '—' : fmt(ago(w.del)),
        ring: 'fill: none; stroke-width: 4; stroke-linecap: round; transition: stroke-dasharray .9s; stroke: ' + color + '; stroke-dasharray: ' + (pct * k * C).toFixed(1) + ' ' + C,
        isOpened: !!opened, caseNum: s.opened[w.id] || '', goCase: () => this.go('cases'),
        open: () => this.setState({ openCase: { wid: w.id, name: w.name, type: w.type, num: '1614/', owner: '', err: '' } }),
        edit: () => this.setState({ edit: edCfg('warns', w0) }),
        del: () => delRow(w.id, 'התראה · ' + w.name)
      };
    });
    const overdueW = warns.filter((w) => w.canOpen).length;

    // judgments
    const JL = ['מסירת כתב תביעה', '60 יום · אין הגנה', 'בקשה בנט', 'פסק דין', 'פסיקתא במסירה', '30 יום · הוצל״פ', 'תיק נפתח · קובי', 'הושלם'];
    let jAlerts = 0;
    const pipeCounts = [0, 0, 0, 0, 0, 0, 0, 0];
    const judgAll = live(D.judg.concat(s.extraJ)).map((j) => {
      const st0 = s.jd[j.id] || { stage: 0 };
      const st = { ...st0, stage: st0.stage || 0, served: st0.servedISO ? daysFrom(st0.servedISO) : (st0.served != null ? st0.served : null), pServed: st0.pServedISO ? daysFrom(st0.pServedISO) : (st0.pServed != null ? st0.pServed : null) };
      const defense = st.served != null ? shiftSat(ago(st.served - 60)) : null;
      const elig = defense ? shiftSat(plus1(defense.d)) : null;
      const fil = st.filing ? { d: new Date(st.filing + 'T12:00:00'), shifted: false } : null;
      const tgt = fil || elig;
      const pDue = st.pServed != null ? shiftSat(ago(st.pServed - 30)) : null;
      const pElig = pDue ? shiftSat(plus1(pDue.d)) : null;
      let eff = st.stage;
      if (eff === 0 && tgt && daysTo(tgt.d) <= 0) eff = 1;
      if (eff === 4 && pElig && daysTo(pElig.d) <= 0) eff = 5;
      const ex = s.jExit[j.id];
      if (!ex) { pipeCounts[eff]++; if (eff === 1 || eff === 5) jAlerts++; }
      const eLeft = tgt ? daysTo(tgt.d) : null, pLeft = pElig ? daysTo(pElig.d) : null;
      if (!ex && eff <= 1 && elig) deadlines.push({ left: eLeft, title: (eff === 1 ? 'הגיע מועד בקשת פס״ד · ' : 'בקשת פס״ד · ') + j.name, sub: (fil ? 'מועד שעו״ד קבעה · ' : 'ניתן להגיש מ־') + fmtL(tgt.d) + (!fil && (elig.shifted || defense.shifted) ? ' · הוזז משבת' : ''), rule: 'תקנה 13 · 60 יום', page: 'judg' });
      if (!ex && (eff === 4 || eff === 5) && pElig) deadlines.push({ left: pLeft, title: (eff === 5 ? 'לפתוח הוצל״פ · ' : 'פתיחת הוצל״פ · ') + j.name, sub: 'ניתן לפתוח מ־' + fmtL(pElig.d), rule: '30 יום', page: 'judg' });
      const leftTxt = (n) => n > 0 ? 'בעוד ' + n + ' ימים' : n === 0 ? 'היום' : 'לפני ' + (-n) + ' ימים';
      let rowDate = '—', rowDateNote = '', rowLeft = null;
      if (eff <= 1 && tgt) { rowDate = fmt(tgt.d); rowDateNote = (fil ? 'נקבע · ' : 'מחושב · ') + leftTxt(eLeft); rowLeft = eLeft; }
      else if ((eff === 4 || eff === 5) && pElig) { rowDate = fmt(pElig.d); rowDateNote = 'הוצל״פ · ' + leftTxt(pLeft); rowLeft = pLeft; }
      else if (eff === 0) rowDateNote = 'ממתין לתאריך מסירה';
      const isOpen = s.openJ === j.id;
      const steps = JL.map((label, i) => ({ label, n: i + 1, cls: 'tstep' + (i < eff ? ' done' : '') + (i === eff ? ' act' : '') }));
      return {
        ...j, eff, open: isOpen, chev: isOpen ? '▴' : '▾', sig: 'sig ' + tone(j.status), steps,
        exited: !!ex, inTrack: !ex, isDone: !!ex || eff === 7, exitText: ex === 'defense' ? 'הוגש כתב הגנה' : 'לקוח בחדל״פ',
        exitDefense: () => { this.setState({ jExit: { ...s.jExit, [j.id]: 'defense' }, openJ: null }); this.say('תיק ' + j.num + ' · הוגש כתב הגנה · יצא מהמסלול, התזכורות הוסרו'); },
        exitInsolv: () => { this.setState({ jExit: { ...s.jExit, [j.id]: 'insolvency' }, openJ: null }); this.say('תיק ' + j.num + ' · לקוח בחדל״פ · יצא מהמסלול, התזכורות הוסרו'); },
        restore: () => { const x = { ...s.jExit }; delete x[j.id]; this.setState({ jExit: x }); this.say('תיק ' + j.num + ' הוחזר למסלול'); },
        stageLabel: ex ? (ex === 'defense' ? 'הוגש כתב הגנה · יצא מהמסלול' : 'לקוח בחדל״פ · יצא מהמסלול') : JL[eff], progW: 'display: block; height: 100%; border-radius: 6px; background: linear-gradient(270deg,#1D4ED8,#2DD4BF); width: ' + Math.round((eff / 7) * 100 * k) + '%',
        a0: !ex && eff === 0, a1: !ex && eff === 1, a2: !ex && eff === 2, a3: !ex && eff === 3, a4: !ex && eff === 4, a5: !ex && eff === 5, a6: !ex && eff === 6, a7: !ex && eff === 7,
        showOther: !!s.other[j.id],
        servedISO: st.served != null ? iso(ago(st.served)) : '', servedDays: st.served,
        promptText: st.served == null ? 'הקלידי תאריך – המערכת תחשב מתי ניתן להגיש' : 'התאריך נקלט ✓',
        hasServed: st.served != null,
        countText: elig ? (eLeft > 0 ? 'עוד ' + eLeft + ' ימים' : eLeft === 0 ? 'אפשר להגיש היום' : 'אפשר להגיש כבר ' + (-eLeft) + ' ימים') : '',
        eligText: elig ? fmtL(elig.d) : '', deadlineText: defense ? fmtL(defense.d) : '',
        shiftNote: defense && defense.shifted ? 'המועד חל בשבת והוזז ליום א׳' : '60 יום מיום המסירה',
        servedText: st.served != null ? fmtL(ago(st.served)) : '',
        rowDate, rowDateNote,
        rowDateStyle: 'font-size: 12.5px; font-weight: 600; color: ' + (rowLeft === null ? '#8A93A8' : rowLeft <= 0 ? '#B91C1C' : rowLeft <= 5 ? '#0E7490' : '#0B1324'),
        pServedISO: st.pServed != null ? iso(ago(st.pServed)) : '', pDays: st.pServed,
        pCountText: pElig ? (pLeft > 0 ? 'עוד ' + pLeft + ' ימים' : pLeft === 0 ? 'אפשר לפתוח היום' : 'אפשר לפתוח כבר ' + (-pLeft) + ' ימים') : '',
        pEligText: pElig ? fmtL(pElig.d) : '', pServedText: st.pServed != null ? fmtL(ago(st.pServed)) : '',
        pShiftNote: pDue && pDue.shifted ? 'המועד חל בשבת והוזז ליום א׳' : '30 יום מיום המסירה',
        toggle: () => this.setState({ openJ: isOpen ? null : j.id }),
        setServed: (e) => { const v = e.target.value; if (v) { this.setJ(j.id, { servedISO: v, stage: 0 }); this.say('תאריך המסירה נשמר · הספירה של 60 יום עודכנה'); } },
        sentNet: () => { this.setJ(j.id, { stage: 2 }); this.say('נרשם: נשלחה בקשה בנט'); },
        gotJudgment: () => { this.setJ(j.id, { stage: 3 }); this.setState({ other: { ...s.other, [j.id]: false } }); this.say('נרשם: ניתן פסק דין · ממתין לפסיקתא'); },
        otherDecision: () => this.setState({ other: { ...s.other, [j.id]: true } }),
        makeTask: () => { this.setState({ other: { ...s.other, [j.id]: false } }); this.say('נוצרה משימה למשימות כלליות · ' + j.num); },
        setPServed: (e) => { const v = e.target.value; if (v) { this.setJ(j.id, { pServedISO: v, stage: 4 }); this.say('נרשם: פסיקתא נשלחה במסירה אישית · ספירת 30 יום החלה'); } },
        openExec: () => { this.setJ(j.id, { stage: 6 }); this.say('תיק הוצל״פ נפתח · נוצרה משימה: האם הוגשו לקובי מסמכים'); },
        kobiDone: () => { this.setJ(j.id, { stage: 7 }); this.say('סומן: המסמכים הוגשו לקובי · המסלול הושלם'); },
        reset: () => { this.setJ(j.id, { stage: 0, servedISO: null, pServedISO: null, filing: null }); },
        showFiling: !ex && eff <= 1 && st.served != null,
        filingISO: st.filing || '', eligShort: elig ? fmt(elig.d) : '',
        filingNote: !fil ? 'לא נקבע · עובד לפי החישוב' : (elig && fil.d < elig.d ? 'שימי לב: מוקדם מהמועד המחושב (' + fmt(elig.d) + ')' : 'נקבע ל־' + fmtL(fil.d) + ' · ' + leftTxt(daysTo(fil.d))),
        filingSig: 'sig ' + (!fil ? 's-wait' : elig && fil.d < elig.d ? 's-alert' : 's-done'),
        setFiling: (e) => { const v = e.target.value; this.setJ(j.id, { filing: v || null }); if (v) this.say('נקבע מועד להגשת בקשה לפס״ד · ' + j.num + ' · תזכורות עודכנו'); },
        useCalc: () => { if (elig) { this.setJ(j.id, { filing: iso(elig.d) }); this.say('נקבע לפי החישוב · ' + fmt(elig.d)); } },
        edit: () => this.setState({ edit: edCfg('judg', j) }),
        del: () => delRow(j.id, 'פסק דין · ' + j.name)
      };
    });
    const byOwner = (r) => s.owner === 'all' || r.owner === s.owner;
    const jTab = s.tabs.judg || 'track';
    const judgOwn = judgAll.filter(byOwner);
    if (P === 'judg') sfPool = judgOwn.map((j) => j.status).concat(judgOwn.map((j) => j.stageLabel));
    const judg = judgOwn.filter((j) => (jTab === 'done') === j.isDone && (sfOk(j.status) || sfOk(j.stageLabel)));

    // agreements
    const curIdx = today.getFullYear() * 12 + today.getMonth();
    const ils = (n) => '₪' + Math.round(n).toLocaleString('he-IL');
    const ymStr = (idx) => Math.floor(idx / 12) + '-' + String(idx % 12 + 1).padStart(2, '0');
    const ymIdx = (v) => { const p = String(v).split('-'); return Number(p[0]) * 12 + Number(p[1]) - 1; };
    const HMF = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const fmtM = (idx) => HMF[idx % 12] + ' ' + Math.floor(idx / 12);
    let totPaid = 0, breachNow = 0, unmarked = 0, totDebt = 0, totArrears = 0, paidThisMonth = 0, lateN = 0;
    const SL = ['בבדיקה', 'נשלח בדואר רשום', 'נשלח במסירה אישית', 'הוגש לקובי לחידוש הליכים'];
    const agrs = D.agrs.concat(s.extraAgrs).filter((g) => !s.removed[g.id]).map(ov).map((g) => {
      const cfg = s.agCfg[g.id] || {};
      const configured = !!(cfg.debt > 0 && cfg.first != null && cfg.last != null && cfg.last >= cfg.first);
      const pays = s.pays[g.id] || {};
      const nPrev = configured ? cfg.last - cfg.first + 1 : 0;
      const base = {
        ...g, open360: open360(g.num), configured, showCfg: !configured || s.cfgOpen === g.id,
        cfgDebt: cfg.debt ? String(cfg.debt) : '', cfgFirst: cfg.first != null ? ymStr(cfg.first) : '', cfgLast: cfg.last != null ? ymStr(cfg.last) : '',
        cfgPreview: configured ? ils(Math.floor(cfg.debt / nPrev)) : '—',
        cfgPreviewSub: configured ? nPrev + ' תשלומים · ' + fmtM(cfg.first) + ' עד ' + fmtM(cfg.last) : 'הזיני סכום חוב, חודש ראשון וחודש אחרון',
        setDebt: (e) => this.setCfg(g.id, { debt: Number(e.target.value) || 0 }),
        setFirst: (e) => { if (e.target.value) this.setCfg(g.id, { first: ymIdx(e.target.value) }); },
        setLast: (e) => { if (e.target.value) this.setCfg(g.id, { last: ymIdx(e.target.value) }); },
        toggleCfg: () => this.setState({ cfgOpen: s.cfgOpen === g.id ? null : g.id }),
        edit: () => this.setState({ edit: edCfg('agrs', g) }),
        del: () => delRow(g.id, 'הסכם · ' + g.name)
      };
      if (!configured) return { ...base, statusCat: 'ממתין להגדרה', askClose: false, closedAg: false, isDone: false, arrears: 0, letterStage: s.letter[g.id] || 0, months: [], stats: [], steps: [], sig: 'sig s-wait', statusText: 'ממתין להגדרת סכום ומועדים', editing: false, asked: false, hasLetter: false };
      const n = nPrev, monthly = Math.floor(cfg.debt / n), lastAmt = cfg.debt - monthly * (n - 1);
      totDebt += cfg.debt;
      let paidTot = 0, arrears = 0, paidMonths = 0;
      const pe = s.payEdit && s.payEdit.ag === g.id ? s.payEdit : null;
      const months = Array.from({ length: n }, (_, i) => {
        const idx = cfg.first + i, y = Math.floor(idx / 12), mo = idx % 12;
        const req = i === n - 1 ? lastAmt : monthly;
        const locked = idx > curIdx, cur = idx === curIdx, p = pays[i], has = p !== undefined;
        if (has) paidTot += p;
        let st = 'none';
        if (locked) st = 'lock'; else if (has) st = p >= req ? 'ok' : p > 0 ? 'part' : 'bad';
        if (!locked && (idx < curIdx || has)) arrears += Math.max(0, req - (p || 0));
        if (st === 'ok') paidMonths++;
        if (cur) { if (st === 'bad' || st === 'part') breachNow++; if (!has) unmarked++; if (has) paidThisMonth += p; }
        const label = HM[mo] + ' ' + String(y).slice(2);
        const isEd = pe && pe.i === i;
        return {
          label, locked, req: ils(req), isOk: st === 'ok', isBad: st === 'bad', isPart: st === 'part',
          paidTxt: has ? 'הועבר ' + ils(p) : locked ? 'נעול' : cur ? 'ממתין' : 'לא הוזן',
          cls: 'mcell pay' + (locked ? ' lock' : '') + (st === 'ok' ? ' ok' : '') + (st === 'bad' ? ' bad' : '') + (st === 'part' ? ' part' : '') + (cur ? ' cur' : '') + (isEd ? ' sel' : ''),
          aria: label + ' · נדרש ' + ils(req) + (has ? ' · הועבר ' + ils(p) : locked ? ' · נעול' : ''),
          click: () => { if (!locked) this.setState({ payEdit: { ag: g.id, i, val: has ? String(p) : '', req, label } }); }
        };
      });
      if (arrears > 0) lateN++;
      totPaid += paidTot;
      totArrears += arrears;
      const savePay = (val) => {
        const v = Math.max(0, Number(val) || 0);
        const upd = { pays: { ...s.pays, [g.id]: { ...pays, [pe.i]: v } }, payEdit: null };
        if (v < pe.req) upd.dialog = { ag: g.id, name: g.name, lawyer: g.lawyer, month: pe.label + (v > 0 ? ' · הועבר ' + ils(v) + ' מתוך ' + ils(pe.req) : ' · לא הועבר תשלום') };
        this.setState(upd);
        this.say(v >= pe.req ? 'נרשם תשלום ' + pe.label + ' · ' + ils(v) : 'נרשם תשלום חסר · ' + pe.label + ' · פיגורים עודכנו');
      };
      const pct = Math.min(100, Math.round((paidTot / cfg.debt) * 100));
      const stage = s.letter[g.id] || 0;
      return {
        ...base, arrears, letterStage: stage, months, range: fmtM(cfg.first) + ' – ' + fmtM(cfg.last),
        stats: [
          { k: 'סכום החוב', v: ils(cfg.debt) }, { k: 'תשלום חודשי', v: ils(monthly) },
          { k: 'שולם עד כה', v: ils(paidTot), t: 'good' }, { k: 'פיגורים', v: ils(arrears), t: arrears ? 'bad' : 'good' },
          { k: 'יתרה לתשלום', v: ils(cfg.debt - paidTot) }, { k: 'חודשים ששולמו', v: paidMonths + ' / ' + n }
        ].map((x) => ({ ...x, cls: 'stat2' + (x.t ? ' ' + x.t : '') })),
        pctW: 'width: ' + Math.round(pct * k) + '%', pctText: pct + '% מהחוב שולם',
        editing: !!pe, edLabel: pe ? pe.label : '', edReq: pe ? ils(pe.req) : '', edVal: pe ? pe.val : '',
        edChange: (e) => this.setState({ payEdit: { ...this.state.payEdit, val: e.target.value } }),
        edFull: () => savePay(pe.req), edZero: () => savePay(0), edSave: () => savePay(pe.val), edClose: () => this.setState({ payEdit: null }),
        hasLetter: stage > 0, asked: s.agTask[g.id] === 'asked',
        steps: SL.map((label, i) => ({ label, n: i + 1, cls: 'tstep' + (i + 1 < stage ? ' done' : '') + (i + 1 === stage ? ' act' : ''), set: () => { this.setState({ letter: { ...s.letter, [g.id]: i + 1 } }); this.say('מכתב הפרה: ' + label); } })),
        statusCat: s.agClosed[g.id] ? 'הועבר לסגירה' : paidTot >= cfg.debt ? 'שולם במלואו' : arrears ? 'בפיגור' : 'עומד בהסכם',
        statusText: s.agClosed[g.id] ? 'שולם · הועבר לסגירה' : paidTot >= cfg.debt ? 'שולם במלואו' : arrears ? 'פיגור ' + ils(arrears) : 'עומד בהסכם', sig: 'sig ' + (arrears && paidTot < cfg.debt ? 's-alert' : 's-done'),
        askClose: paidTot >= cfg.debt && !s.agClosed[g.id] && !s.agNoClose[g.id], closedAg: !!s.agClosed[g.id], isDone: paidTot >= cfg.debt || !!s.agClosed[g.id],
        closeYes: () => { this.setState({ agClosed: { ...s.agClosed, [g.id]: true }, extraClosures: s.extraClosures.concat([{ id: 'kc' + g.id, num: g.num, name: g.name, owner: g.lawyer, status: 'בטיפול', note: 'נוצר מהסכם ששולם במלואו' }]), extraTasks: s.extraTasks.concat([{ id: 'tc' + g.id, num: g.num, name: g.name, desc: 'הכנת טופס סגירה · ההסכם שולם במלואו', owner: g.lawyer, status: 'בטיפול', note: '', auto: 'אוטומציה' }]) }); this.say('נוצרה סגירת חשבון ומשימה "הכנת טופס סגירה" · ' + g.num); },
        closeNo: () => { this.setState({ agNoClose: { ...s.agNoClose, [g.id]: true } }); this.say('נשמר · אפשר להכין טופס סגירה מאוחר יותר'); },
        approve: () => { this.setState({ agTask: { ...s.agTask, [g.id]: 'done' }, letter: { ...s.letter, [g.id]: 1 } }); this.say('נפתחה משימה: הכנת מכתב הפרת הסכם · בבדיקה'); },
        reject: () => { this.setState({ agTask: { ...s.agTask, [g.id]: 'done' } }); this.say('המשימה נסגרה · ההסכם ממשיך'); }
      };
    });
    const agrKpis = [
      { code: 'TOTAL DEBT', label: 'סה״כ חוב בהסכמים', v: ils(totDebt), c: '#0B1324' },
      { code: 'COLLECTED · MONTH', label: 'הועבר החודש', v: ils(paidThisMonth), c: '#0F766E' },
      { code: 'ARREARS', label: 'פיגורים כוללים', v: ils(totArrears), c: totArrears ? '#B91C1C' : '#0F766E' },
      { code: 'LATE', label: 'הסכמים בפיגור', v: lateN + ' / ' + agrs.length, c: lateN ? '#B91C1C' : '#0B1324' }
    ].map((x) => ({ ...x, vStyle: 'font-size: 24px; font-weight: 600; margin-top: 10px; color: ' + x.c }));
    if (unmarked) deadlines.push({ left: 10 - today.getDate() > 0 ? 10 - today.getDate() : 0, title: unmarked + ' הסכמים ללא תשלום רשום החודש', sub: 'רישום תשלום עד ה-10 לחודש', rule: 'כלל משרדי', page: 'agrs' });

    // cases registry
    const CS = ['חדש – ממתין למסלול', 'מו״מ', 'הסכם', 'חדלות פירעון', 'תביעה', 'סגור'];
    const caseTone = (st) => ({ 'חדש – ממתין למסלול': 's-alert', 'מו״מ': 's-prog', 'הסכם': 's-done', 'חדלות פירעון': 's-gold', 'תביעה': 's-review', 'סגור': 's-wait' })[st] || 's-wait';
    const casesAll = s.cases.filter((c) => !s.removed[c.id]).map(ov);
    const newCases = casesAll.filter((c) => c.status === CS[0]).length;
    const cf = s.caseFilter;
    const liveStatus = (c) => {
      const J = judgAll.find((x) => x.num === c.num), A = agrs.find((x) => x.num === c.num), C = claims.find((x) => x.num === c.num), S = seizures.find((x) => x.num === c.num), K = closures.find((x) => x.num === c.num);
      if (J && J.exited) return { t: J.exitText === 'הוגש כתב הגנה' ? 'הוגש כתב הגנה · הליך משפטי' : 'חדלות פירעון', tone: 's-gold', src: 'פסקי דין', p: 'judg', l: 'פסקי דין' };
      if (J && J.eff >= 6) return { t: 'ננקטים הליכים בלשכת ההוצל״פ', tone: 's-exec', src: 'פסקי דין', p: 'judg', l: 'פסקי דין' };
      if (S) return { t: 'ננקטים הליכים בלשכת ההוצל״פ · עיקול', tone: 's-exec', src: 'עיקולים', p: 'seizures', l: 'עיקולים' };
      if (J) {
        const M = [['תביעה הוגשה · ממתין לכתב הגנה', 's-review'], ['חלפו 60 יום · ניתן לבקש פס״ד', 's-alert'], ['בקשה לפס״ד הוגשה בנט', 's-net'], ['ניתן פסק דין', 's-done'], ['פסיקתא נשלחה במסירה אישית', 's-done'], ['פס״ד · יש לפתוח תיק הוצל״פ', 's-alert']][J.eff];
        return { t: M[0], tone: M[1], src: 'פסקי דין', p: 'judg', l: 'פסקי דין' };
      }
      if (A) {
        const base = { src: 'הסכמים', p: 'agrs', l: 'הסכמים' };
        if (A.closedAg) return { ...base, t: 'הסכם שולם · סגירת חשבון', tone: 's-done' };
        if (A.letterStage === 4) return { ...base, t: 'הוגש לקובי לחידוש הליכים', tone: 's-exec' };
        if (A.letterStage > 0) return { ...base, t: 'הפרת הסכם · מכתב הפרה בתהליך', tone: 's-alert' };
        if (!A.configured) return { ...base, t: 'הסכם · ממתין להגדרת תשלומים', tone: 's-wait' };
        if (A.arrears > 0) return { ...base, t: 'הסכם הופר · פיגור ' + ils(A.arrears), tone: 's-alert' };
        return { ...base, t: 'הסכם · עומד בתשלומים', tone: 's-done' };
      }
      if (C) return C.status === 'הוגש' ? { t: 'תביעה הוגשה', tone: 's-review', src: 'תביעות', p: 'claims', l: 'תביעות' } : { t: 'תביעה בהכנה · ' + C.status, tone: 's-prog', src: 'תביעות', p: 'claims', l: 'תביעות' };
      if (K) return { t: 'סגירת חשבון · ' + K.status, tone: 's-gold', src: 'סגירות חשבון', p: 'closures', l: 'סגירות' };
      return { t: c.status === 'מו״מ' ? 'מו״מ עם החייב' : c.status, tone: caseTone(c.status), src: 'בחירה ידנית', p: null };
    };
    const execN = casesAll.filter((c) => liveStatus(c).tone === 's-exec').length;
    if (P === 'cases') sfPool = casesAll.filter(byOwner).map((c) => liveStatus(c).t);
    const caseRows = casesAll.filter((c) => (cf === 'all' || (cf === 'exec' ? liveStatus(c).tone === 's-exec' : c.status === cf)) && byOwner(c) && sfOk(liveStatus(c).t)).map((c) => {
      const inClaims = claims.some((r) => r.num === c.num), inAgr = agrs.some((r) => r.num === c.num);
      const ls = liveStatus(c);
      const link = ls.p ? { l: ls.l, p: ls.p } : null;
      return {
        ...c, fromWarn: c.src === 'מהתראה', open360: open360(c.num),
        liveText: ls.t, liveSig: 'sig ' + ls.tone, liveSrc: ls.src,
        openedTxt: c.openedISO ? fmt(new Date(c.openedISO + 'T12:00:00')) : '—',
        ownerCls: 'selx' + (c.owner ? '' : ' empty'), selCls: 'selx ' + caseTone(c.status),
        hasLink: !!link, noLink: !link, linkLabel: link ? link.l : '', goLink: () => link && this.go(link.p),
        setOwner: (e) => { const v = e.target.value; this.setState({ cases: s.cases.map((x) => x.id === c.id ? { ...x, owner: v } : x) }); this.say('תיק ' + c.num + ' שויך לעו״ד ' + v); },
        setStatus: (e) => {
          const v = e.target.value;
          const upd = { cases: s.cases.map((x) => x.id === c.id ? { ...x, status: v } : x) };
          let msg = 'תיק ' + c.num + ' · סטטוס: ' + v;
          if (v === 'תביעה' && !inClaims) { upd.extraClaims = s.extraClaims.concat([{ id: 'ec' + c.num, num: c.num, name: c.name, owner: c.owner || '—', type: '', prep: '', status: 'ניתן להכין', note: 'נפתח מטבלת תיקים', auto: 'מתיקים' }]); msg = 'תיק ' + c.num + ' נשלח לטבלת תביעות · ניתן להכין'; }
          if (v === 'הסכם' && !inAgr) { upd.extraAgrs = s.extraAgrs.concat([{ id: 'ea' + c.num, num: c.num, name: c.name, lawyer: c.owner || '—' }]); msg = 'תיק ' + c.num + ' נשלח לטבלת הסכמים · להזין סכום ומועדים'; }
          this.setState(upd); this.say(msg);
        },
        edit: () => this.setState({ edit: edCfg('cases', c) }),
        del: () => delRow(c.id, 'תיק ' + c.num)
      };
    });
    const caseKpis = [{ v: 'all', label: 'כל התיקים' }].concat(CS.slice(0, 5).map((x) => ({ v: x, label: x === CS[0] ? 'חדש' : x }))).concat([{ v: 'exec', label: 'הליכים בהוצל״פ' }]).map((x) => ({
      ...x, n: Math.round((x.v === 'all' ? casesAll.length : x.v === 'exec' ? execN : casesAll.filter((c) => c.status === x.v).length) * k),
      sig: 'sig ' + (x.v === 'all' ? 's-net' : x.v === 'exec' ? 's-exec' : caseTone(x.v)), cls: 'tile kpi' + (cf === x.v ? ' kon' : ''),
      pick: () => this.setState({ caseFilter: x.v })
    }));
    const ownerOpts = [{ v: '', label: '— לשיוך —' }].concat(D.owners.map((o) => ({ v: o, label: o })));

    // suggestions
    const SG = [];
    if (pendingSvc.length) SG.push({ id: 'g1', text: pendingSvc.length + ' תביעות בימ״ש הוגשו וממתינות למסירה אישית. ליצור תזכורת שבועית לבדיקת אישורי מסירה?', yesLabel: 'צור תזכורת', msg: 'נוצרה תזכורת שבועית לבדיקת מסירות' });
    const noPrep = claims.filter((r) => r.status !== 'הוגש' && !r.prep).length;
    if (noPrep) SG.push({ id: 'g2', text: noPrep + ' תביעות פעילות בלי תאריך הכנה. ליצור משימה להשלמת התאריכים?', yesLabel: 'צור משימה', msg: 'נוצרה משימה להשלמת תאריכי הכנה' });
    const feeWait = closures.filter((r) => r.status === 'מחכה לשכר טרחה').length;
    if (feeWait) SG.push({ id: 'g3', text: feeWait + ' סגירות חשבון ממתינות לשכר טרחה. ליצור תזכורת מעקב?', yesLabel: 'צור תזכורת', msg: 'נוצרה תזכורת מעקב שכר טרחה' });
    const suggs = SG.filter((g) => !s.dismissed[g.id]).map((g) => ({ ...g, yes: () => { this.setState({ dismissed: { ...s.dismissed, [g.id]: 1 } }); this.say(g.msg); }, no: () => this.setState({ dismissed: { ...s.dismissed, [g.id]: 1 } }) }));

    // dashboard
    deadlines.sort((a, b) => a.left - b.left);
    const dl = deadlines.filter((d) => d.left <= 14).slice(0, 7).map((d) => {
      const late = d.left <= 0, near = d.left > 0 && d.left <= 5;
      return { ...d, left: late ? '!' : d.left, unit: late ? 'עבר' : 'ימים', go: () => this.go(d.page),
        boxStyle: late ? 'background: #FDF1F1; color: #B91C1C; border: 1px solid #F0BDBD' : near ? 'background: #ECF8FA; color: #0E7490; border: 1px solid #A6D6E0' : 'background: #EFF3FE; color: #1D4ED8; border: 1px solid #C3D2F7' };
    });
    const actionToday = overdueW + jAlerts + breachNow + suggs.length;
    const week = deadlines.filter((d) => d.left > 0 && d.left <= 7).length;
    const allActive = claims.concat(seizures, closures, tasks, judgAll);
    const revAll = cnt(allActive, isRev);
    const kpis = [
      { code: 'ACTION · TODAY', n: Math.round(actionToday * k), label: 'דורש פעולה היום', tag: 'דחוף', sig: 'sig s-alert', go: () => this.go('warns') },
      { code: 'DEADLINES · 7D', n: Math.round(week * k), label: 'מועדים בשבוע הקרוב', tag: 'מתקרב', sig: 'sig s-prog', go: () => this.go('judg') },
      { code: 'IN REVIEW', n: Math.round(revAll * k), label: 'פריטים בבדיקה בכל הטבלאות', tag: 'בבדיקה', sig: 'sig s-review', go: () => this.go('claims') },
      { code: 'AUTOMATION', n: Math.round(tasks.filter((t) => t.auto).length * k), label: 'משימות שהמערכת יצרה', tag: 'פעיל', sig: 'sig s-net', go: () => this.go('rules') }
    ].map((c, i) => ({ ...c, style: 'grid-column: span 3; animation-delay: ' + i * 70 + 'ms',
      ic: ['M12 8v5M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18', 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14M20 20l-4-4', 'M13 2L4 14h7l-1 8 9-12h-7z'][i],
      icBg: ['background: linear-gradient(135deg,#F87171,#B4474F)', 'background: linear-gradient(135deg,#2DD4BF,#1C8582)', 'background: linear-gradient(135deg,#60A5FA,#1E5A84)', 'background: linear-gradient(135deg,#818CF8,#23395B)'][i] }));
    const mrow = (name, arr, page, waitF) => ({ name, review: cnt(arr, isRev), prog: cnt(arr, (r) => r.status === 'בטיפול' || r.status === 'ניתן להכין'), wait: cnt(arr, waitF), done: cnt(arr, (r) => r.status === 'הוגש' || r.status === 'הושלם'), go: () => this.go(page) });
    const matrix = [
      mrow('תביעות', claims, 'claims', (r) => ['מחכה למסירה', 'בהמתנה', 'מחכה לחלוף המועד'].indexOf(r.status) >= 0),
      mrow('עיקולים', seizures, 'seizures', (r) => r.status.indexOf('הוגש בנט') === 0 || r.status === 'בבדיקה'),
      mrow('סגירות חשבון', closures, 'closures', (r) => ['מחכה לדיבידנד', 'מחכה לשכר טרחה', 'הוגש לאבי'].indexOf(r.status) >= 0),
      mrow('משימות', tasks, 'tasks', () => false),
      mrow('פסקי דין', judgAll, 'judg', (r) => r.status === 'בהמתנה')
    ];
    const pc = D.owners.map((o) => ({ name: o, n: cnt(allActive, (r) => r.status === 'בבדיקה אצל ' + o) }));
    const pmax = Math.max(1, ...pc.map((p) => p.n));
    const busiest = pc.slice().sort((a, b) => b.n - a.n)[0], freest = pc.slice().sort((a, b) => a.n - b.n)[0];
    const people = pc.map((p) => ({ ...p, w: 'width: ' + Math.round((p.n / pmax) * 100 * k) + '%' }));
    const pipeline = JL.map((label, i) => ({ label, n: pipeCounts[i], fill: 'position: absolute; inset: auto 0 0 0; height: ' + Math.round((pipeCounts[i] / Math.max(1, ...pipeCounts)) * 100 * k) + '%; background: linear-gradient(0deg, rgba(29,78,216,.08), rgba(29,78,216,0))' }));

    // tables
    const KIND = { claims: 'תביעה', seizures: 'עיקול', closures: 'סגירת חשבון', tasks: 'משימה' };
    const mk = (r, page) => ({
      ...r, sig: 'sig ' + tone(r.status), open360: open360(r.num),
      extra: page === 'claims' ? (r.type || '—') + (r.prep ? ' · ' + fmt(new Date(r.prep + 'T12:00:00')) : '') : page === 'tasks' ? r.desc : (page === 'seizures' ? 'עיקול' : 'סגירה'),
      auto: !!r.auto, autoLabel: r.auto || '',
      edit: () => this.setState({ edit: edCfg(page, r) }),
      del: () => delRow(r.id, r.name)
    });
    let tp = { active: [], done: [] };
    const isTable = ['claims', 'seizures', 'closures', 'tasks'].indexOf(P) >= 0;
    if (isTable) {
      const src = { claims, seizures, closures, tasks }[P];
      const doneSet = P === 'closures' || P === 'tasks' ? ['הושלם'] : ['הוגש'];
      sfPool = src.filter(byOwner).map((r) => r.status);
      const act = src.filter((r) => doneSet.indexOf(r.status) < 0 && byOwner(r) && sfOk(r.status)).map((r) => mk(r, P));
      const done = src.filter((r) => doneSet.indexOf(r.status) >= 0 && byOwner(r) && sfOk(r.status) && pendingSvc.indexOf(r) < 0).map((r) => { const x = mk(r, P); if (s.movedJ[r.id]) x.extra = x.extra + ' · הועבר לפסקי דין'; if (s.svcExit[r.id]) x.extra = x.extra + ' · לקוח בחדל״פ'; return x; });
      const svc = P === 'claims' ? pendingSvc.filter((r) => byOwner(r) && sfOk(r.status)).map((r) => { const x = mk(r, P); return { ...x, waitText: r.prep ? 'הוכנה ' + fmt(new Date(r.prep + 'T12:00:00')) : 'תאריך הכנה לא צוין', insolv: () => { this.setState({ svcExit: { ...s.svcExit, [r.id]: 'insolvency' } }); this.say('תיק ' + r.num + ' · לקוח בחדל״פ · הוסר ממעקב המסירה והמשימה נמחקה'); }, setServed: (e) => { const v = e.target.value; if (!v) return; const jid = 'jx' + r.id; this.setState({ movedJ: { ...s.movedJ, [r.id]: true }, extraJ: s.extraJ.concat([{ id: jid, num: r.num, name: r.name, owner: r.owner, status: 'בטיפול' }]), jd: { ...s.jd, [jid]: { servedISO: v, stage: 0 } }, openJ: jid }); this.say('תיק ' + r.num + ' הועבר לפסקי דין · ספירת 60 יום החלה'); } }; }) : [];
      const T = { claims: ['תביעות פעילות', 'תביעות שהוגשו', 'סוג · תאריך הכנה'], seizures: ['עיקולים פעילים', 'עיקולים שהוגשו', 'סוג'], closures: ['סגירות בתהליך', 'סגירות שהושלמו', 'סוג'], tasks: ['משימות פעילות', 'משימות שהושלמו', 'תיאור המשימה'] }[P];
      const netN = P === 'seizures' ? cnt(src, (r) => r.status.indexOf('הוגש בנט') === 0) : 0;
      const tc = s.tabs[P] || 'active';
      tp = { showActive: tc === 'active', showDone: tc === 'done', showSvc: tc === 'svc', noSvc: svc.length === 0, active: act, noActive: act.length === 0, done, svc, hasSvc: svc.length > 0, svcCount: svc.length, hasDone: true, activeCount: act.length, doneCount: done.length, activeTitle: T[0], doneTitle: T[1], extraLabel: T[2], hint: netN > 0, hintText: netN + ' הוגשו בנט וממתינים להחלטה' };
    }
    const misc = misc0.map((r) => ({ ...r, open360: open360(r.num), edit: () => this.setState({ edit: edCfg('misc', r) }), del: () => delRow(r.id, 'שונות · ' + r.name) }));

    // case 360
    let c360 = null;
    if (s.c360) {
      const n = s.c360, items = [];
      const add = (arr, kind, f) => arr.filter((r) => r.num === n).forEach((r) => items.push({ kind, name: r.name, status: f ? f(r) : r.status, sig: 'sig ' + tone(f ? f(r) : r.status) }));
      add(casesAll, 'תיק · טבלת תיקים');
      add(claims, 'תביעה'); add(seizures, 'עיקול'); add(closures, 'סגירת חשבון'); add(tasks, 'משימה · ' ); add(judgAll, 'פסק דין', (r) => r.stageLabel); add(agrs, 'הסכם', (r) => r.statusText); add(misc0, 'שונות', (r) => r.note);
      c360 = { num: n, items };
    }

    const rules = D.rules.map((r, i) => ({ ...r, code: 'RULE ' + String(i + 1).padStart(2, '0'), verify: !!r.v, on: !!s.rules[r.id], swCls: 'sw' + (s.rules[r.id] ? ' on' : ''), aria: (s.rules[r.id] ? 'כיבוי ' : 'הפעלה ') + r.title, toggle: () => { this.setState({ rules: { ...s.rules, [r.id]: s.rules[r.id] ? 0 : 1 } }); this.say((s.rules[r.id] ? 'כובה: ' : 'הופעל: ') + r.title); } }));
    const rulesOn = Object.values(s.rules).filter(Boolean).length;

    const NAV = [
      { id: 'home', label: 'דשבורד', d: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z' },
      { id: 'cases', label: 'תיקים', d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18', badge: newCases, hot: newCases > 0 },
      { id: 'claims', label: 'תביעות', d: 'M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0zM8 21h8', badge: cnt(claims, (r) => r.status !== 'הוגש') },
      { id: 'judg', label: 'פסקי דין', d: 'M14 4l6 6M11 7l6 6M8 10l6-6M10 12l-6 6 2 2 6-6M13 20h8', badge: jAlerts, hot: jAlerts > 0 },
      { id: 'seizures', label: 'עיקולים', d: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4', badge: cnt(seizures, (r) => r.status !== 'הוגש') },
      { id: 'closures', label: 'סגירות חשבון', d: 'M4 6h16v12H4zM4 10h16M8 15h3', badge: cnt(closures, (r) => r.status !== 'הושלם') },
      { id: 'tasks', label: 'משימות כלליות', d: 'M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2', badge: cnt(tasks, (r) => r.status !== 'הושלם') },
      { id: 'warns', label: 'מכתבי התראה', d: 'M3 6h18v12H3zM3 7l9 6 9-6', badge: overdueW, hot: overdueW > 0 },
      { id: 'agrs', label: 'הסכמים', d: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4', badge: breachNow + unmarked, hot: breachNow > 0 },
      { id: 'misc', label: 'שונות', d: 'M5 5h4v4H5zM15 5h4v4h-4zM5 15h4v4H5zM15 15h4v4h-4z', badge: misc0.length },
      { id: 'rules', label: 'מנוע אוטומציה', d: 'M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M6 6h12v12H6zM10 10h4v4h-4z' }
    ];
    const nav = NAV.map((n) => ({ ...n, cls: 'navb' + (P === n.id ? ' on' : ''), hasBadge: !!n.badge, badgeCls: 'nbadge' + (n.hot ? ' hot' : ''), go: () => this.go(n.id) }));
    const BN = ['home', 'cases', 'warns', 'judg', 'agrs'];
    const bnav = BN.map((id) => nav.find((n) => n.id === id)).map((n) => ({ ...n, label: ({ warns: 'התראות', judg: 'פס״ד' })[n.id] || n.label, cls: P === n.id ? 'on' : '', hot: !!n.hot })).concat([{ id: 'more', label: 'עוד', d: 'M5 12h.01M12 12h.01M19 12h.01', cls: BN.indexOf(P) < 0 ? 'on' : '', hot: false, go: () => this.setState({ more: true }) }]);
    const byId = (ids) => ids.map((id) => nav.find((n) => n.id === id));
    const navGroups = [
      { label: 'סקירה', items: byId(['home', 'cases']) },
      { label: 'הליכים', items: byId(['warns', 'claims', 'judg', 'seizures', 'closures']) },
      { label: 'מעקב', items: byId(['agrs', 'tasks', 'misc']) },
      { label: 'מערכת', items: byId(['rules']) }
    ];
    const oc = s.openCase;
    const ocView = oc ? {
      ...oc, sub: oc.type + ' · עבר המועד ממסירת ההתראה', ownerCls: 'selx' + (oc.owner ? '' : ' empty'), errText: oc.err,
      setNum: (e) => this.setState({ openCase: { ...this.state.openCase, num: e.target.value, err: '' } }),
      setOwner: (e) => this.setState({ openCase: { ...this.state.openCase, owner: e.target.value, err: '' } }),
      cancel: () => this.setState({ openCase: null }),
      confirm: () => {
        const oc2 = this.state.openCase; const num = String(oc2.num || '').trim();
        if (!num || num === '1614/') return this.setState({ openCase: { ...oc, err: 'יש להזין מספר תיק' } });
        if (s.cases.some((c) => c.num === num)) return this.setState({ openCase: { ...oc, err: 'מספר תיק ' + num + ' כבר קיים בטבלת תיקים' } });
        if (!oc2.owner) return this.setState({ openCase: { ...oc2, err: 'יש לבחור עו״ד מטפלת' } });
        this.setState({ openCase: null, opened: { ...s.opened, [oc.wid]: num }, nextNum: Math.max(s.nextNum, (Number(num) || 0)) + 1, cases: s.cases.concat([{ id: 'K' + num, num, name: oc.name, owner: oc.owner, status: 'חדש – ממתין למסלול', src: 'מהתראה', openedISO: iso(today) }]) });
        this.say('נפתח תיק ' + num + ' · עו״ד ' + oc.owner + ' · נשלח לטבלת תיקים');
      }
    } : { err: '' };
    const repTables = [['תביעות', claims], ['פסקי דין', judgAll], ['עיקולים', seizures], ['סגירות חשבון', closures], ['משימות כלליות', tasks]];
    const reportGroups = D.owners.map((o) => {
      const sections = repTables.map(([title, rows]) => ({ title, rows: rows.filter((r) => r.status === 'בבדיקה אצל ' + o).map((r) => ({ num: r.num || '—', name: r.name, resp: r.owner || '', extra: r.desc || r.note || '' })) })).filter((x) => x.rows.length);
      return { name: o, sections, count: sections.reduce((a, x) => a + x.rows.length, 0) };
    }).filter((g) => g.count);
    const reportTotal = reportGroups.reduce((a, g) => a + g.count, 0);
    const mkTabs = (list, def) => { const cur = s.tabs[P] || def; return list.map((t) => ({ label: t[1], n: t[2], on: cur === t[0], cls: cur === t[0] ? 'on' : '', pick: () => this.setState({ tabs: { ...s.tabs, [P]: t[0] } }) })); };
    const agOwn = agrs.filter((g) => s.owner === 'all' || g.lawyer === s.owner);
    const warnsOpenN = warns.filter((w) => !w.isOpened).length;
    let tabs = [];
    if (isTable) {
      const TL = { claims: ['תביעות פעילות', 'תביעות שהושלמו'], seizures: ['עיקולים פעילים', 'עיקולים שהושלמו'], closures: ['סגירות בתהליך', 'סגירות שהושלמו'], tasks: ['משימות פעילות', 'משימות שהושלמו'] }[P];
      tabs = mkTabs([['active', TL[0], tp.active.length], ['done', TL[1], tp.done.length]].concat(P === 'claims' ? [['svc', 'ממתינות לאישור מסירה', tp.svc.length]] : []), 'active');
    } else if (P === 'judg') tabs = mkTabs([['track', 'במסלול', judgOwn.filter((j) => !j.isDone).length], ['done', 'הושלמו / יצאו מהמסלול', judgOwn.filter((j) => j.isDone).length]], 'track');
    else if (P === 'warns') tabs = mkTabs([['open', 'במעקב', warnsOpenN], ['done', 'נפתח תיק', warns.length - warnsOpenN]], 'open');
    else if (P === 'agrs') tabs = mkTabs([['active', 'הסכמים פעילים', agOwn.filter((g) => !g.isDone).length], ['done', 'שולמו במלואם', agOwn.filter((g) => g.isDone).length]], 'active');
    if (P === 'warns') sfPool = warns.map((w) => w.status);
    if (P === 'agrs') sfPool = agOwn.map((g) => g.statusCat);
    const warnsShown = warns.filter((w) => ((s.tabs.warns || 'open') === 'done') === !!w.isOpened && sfOk(w.status));
    const agShown = agOwn.filter((g) => ((s.tabs.agrs || 'active') === 'done') === g.isDone && sfOk(g.statusCat));
    const telem = [
      { k: 'תיקים', v: casesAll.length }, { k: 'בבדיקה', v: revAll }, { k: 'דורש פעולה', v: actionToday },
      { k: 'מועדים · 7 ימים', v: week }, { k: 'פיגורים', v: ils(totArrears) }, { k: 'מועד קרוב', v: (() => { const x = deadlines.find((d) => d.left > 0); return x ? x.left + ' ימים' : '—'; })() }
    ];
    const TT = {
      home: ['DASHBOARD', 'תמונת מצב', 'מה דורש פעולה, מה מתקרב, ומה המערכת כבר עשתה'],
      cases: ['REGISTRY · CASES', 'תיקים', 'כל התיקים במקום אחד · בחירת סטטוס מנתבת את התיק לטבלה המתאימה'],
      claims: ['TABLE · CLAIMS', 'תביעות', 'תביעות פעילות ותביעות שהוגשו'],
      judg: ['TRACK · JUDGMENTS', 'פסקי דין', 'תביעות בית משפט · מסירה ← 60 יום ← נט ← פסק דין ← פסיקתא ← הוצל״פ ← קובי'],
      seizures: ['TABLE · SEIZURES', 'עיקולים', 'כולל סטטוס "הוגש בנט – טרם ניתנה החלטה"'],
      closures: ['TABLE · CLOSURES', 'סגירות חשבון', 'סגירות בתהליך וסגירות שהושלמו'],
      tasks: ['TABLE · TASKS', 'משימות כלליות', 'כולל משימות שהמנוע יצר'],
      warns: ['TRACK · NOTICES', 'מכתבי התראה', 'ספירה מתאריך המסירה · מועד בשבת נדחה ליום א׳'],
      agrs: ['TRACK · AGREEMENTS', 'הסכמים', 'סכום חוב · תשלום חודשי · שולם · פיגורים – מחושב אוטומטית · חודש עתידי נפתח ב-1 לחודש'],
      misc: ['TABLE · MISC', 'שונות', 'הערות כלליות לפי תיק'],
      rules: ['ENGINE · RULES', 'מנוע האוטומציה', 'כללים, מועדים וסעיפי חוק · הפעלה וכיבוי לכל כלל']
    };
    const ownerChips = [{ v: 'all', label: 'כולן' }].concat(D.owners.map((o) => ({ v: o, label: o }))).map((o) => ({ ...o, cls: 'chip' + (s.owner === o.v ? ' on' : ''), pick: () => this.setState({ owner: o.v }) }));
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const nd = deadlines.find((d) => d.left > 0);
    const hr = new Date().getHours();
    const greet = hr < 12 ? 'בוקר טוב' : hr < 17 ? 'צהריים טובים' : 'ערב טוב';
    const briefParts = [];
    if (overdueW) briefParts.push(overdueW + ' מכתבי התראה מוכנים לפתיחת תיק');
    if (jAlerts) briefParts.push(jAlerts + ' פסקי דין הגיעו לשלב שדורש פעולה');
    if (breachNow) briefParts.push(breachNow + ' הפרות הסכם החודש');
    if (unmarked) briefParts.push(unmarked + ' הסכמים ללא תשלום רשום החודש');
    if (newCases) briefParts.push(newCases + ' תיקים חדשים ממתינים לבחירת מסלול');
    if (totArrears) briefParts.push('פיגורים בהסכמים: ' + ils(totArrears));
    const heroBrief = (briefParts.length ? 'היום על השולחן: ' + briefParts.join(' · ') + '. ' : 'אין פעולות דחופות היום. ') + (week ? week + ' מועדים נוספים בשבוע הקרוב כבר מחושבים ומתוזכרים.' : '');
    const collectPct = totDebt ? Math.round((totPaid / totDebt) * 100) : 0;
    const urgentPage = overdueW ? 'warns' : jAlerts ? 'judg' : 'agrs';
    return {
      heroGreeting: greet + ', הנה תמונת המצב', heroBrief,
      actionN: Math.round(actionToday * k),
      ringLabel: 'נגבו ' + collectPct + '% מחובות ההסכמים',
      ringStyle: 'fill: none; stroke: url(#rg); stroke-width: 10; stroke-linecap: round; transition: stroke-dasharray .8s; stroke-dasharray: ' + (collectPct / 100 * 326.7 * k).toFixed(1) + ' 326.7',
      heroChips: [
        { label: 'נגבו ' + collectPct + '% מחובות ההסכמים', go: () => this.go('agrs') },
        { label: week + ' מועדים השבוע', go: () => this.go('judg') },
        { label: revAll + ' בבדיקה', go: () => this.go('claims') },
        { label: newCases + ' תיקים חדשים', go: () => this.go('cases') }
      ],
      bnav, moreItems: nav.map((n) => ({ ...n, go: () => { this.setState({ more: false }); this.go(n.id); } })), showMore: !!s.more, closeMore: () => this.setState({ more: false }), navGroups, telem, hasOpenCase: !!oc, oc: ocView,
      isCases: P === 'cases', caseKpis, caseRows, caseCount: caseRows.length, caseStatuses: CS, ownerOpts, agrKpis,
      agrs: agShown, noAgrs: agShown.length === 0, tabs, hasTabs: tabs.length > 0,
      hasSF: ['claims', 'seizures', 'closures', 'tasks', 'judg', 'warns', 'agrs', 'cases'].indexOf(P) >= 0,
      sfVal: sfv, sfActive: sfv !== 'all', sfCls: 'selx' + (sfv !== 'all' ? ' s-review' : ''),
      sfOpts: [{ v: 'all', label: 'כל הסטטוסים' }].concat(Array.from(new Set(sfPool.filter(Boolean))).concat(sfv !== 'all' && sfPool.indexOf(sfv) < 0 ? [sfv] : []).map((x) => ({ v: x, label: x + ' (' + sfPool.filter((y) => y === x).length + ')' }))),
      sfSet: (e) => this.setState({ sf: { ...(s.sf || {}), [P]: e.target.value } }),
      sfClear: () => this.setState({ sf: { ...(s.sf || {}), [P]: 'all' } }),
      agrShownText: (s.owner === 'all' ? 'כל ההסכמים' : 'הסכמים בטיפול עו״ד ' + s.owner) + ' · ' + agrs.filter((g) => s.owner === 'all' || g.lawyer === s.owner).length,
      goUrgent: () => this.go(urgentPage),
      log: s.log, autopilot: s.autopilot, autoCls: 'ap' + (s.autopilot ? ' on' : ''), autoLabel: s.autopilot ? 'פעיל' : 'כבוי',
      autoHint: s.autopilot ? 'משימות ותזכורות נוצרות לבד. פתיחת תיק ומעבר שלב משפטי תמיד ממתינים לאישור שלך.' : 'המערכת רק מסמנת ומציעה. שום משימה לא נוצרת בלי לחיצה.',
      toggleAuto: () => { this.setState({ autopilot: !s.autopilot }); this.say(s.autopilot ? 'טייס אוטומטי כובה' : 'טייס אוטומטי הופעל'); },
      nav, pageCode: TT[P][0], pageTitle: TT[P][1], pageSub: TT[P][2],
      todayLabel: 'יום ' + days[today.getDay()] + ' · ' + fmt(today),
      nextDeadline: nd ? nd.title + ' · בעוד ' + nd.left + ' ימים' : '—',
      isHome: P === 'home', isTable, isWarn: P === 'warns', isAgr: P === 'agrs', isJ: P === 'judg', isMisc: P === 'misc', isRules: P === 'rules',
      kpis, deadlines: dl, noDeadlines: dl.length === 0, suggs, suggCount: suggs.length, noSugg: suggs.length === 0, matrix, people, pipeline,
      balanceTip: busiest.n - freest.n >= 2 ? 'הצעה: להעביר בדיקה מ' + busiest.name + ' ל' + freest.name + ' כדי לאזן עומס.' : 'העומס מאוזן בין הבודקות.',
      goJ: () => this.go('judg'), tp, ownerChips, misc, miscCount: misc.length,
      addMisc: () => this.setState({ edit: edCfg('misc', {}, true) }),
      noJudg: judg.length === 0, noWarns: warnsShown.length === 0, noMisc: misc.length === 0, noCases: caseRows.length === 0,
      judg, jCount: judg.length, warns: warnsShown, warnCount: warnsShown.length, rules, rulesOn, autoToday: tasks.filter((t) => t.auto).length, owners: D.owners,
      hasDialog: !!s.dialog, dlg: s.dialog || {},
      dlgYes: () => { const d = s.dialog; this.setState({ dialog: null, agTask: { ...s.agTask, [d.ag]: 'asked' } }); this.say('נוצרה משימה: לשאול את עו״ד ' + d.lawyer); },
      dlgNo: () => { this.setState({ dialog: null }); this.say('ההפרה נשמרה, ללא משימה'); },
      hasEdit: !!s.edit, ed: s.edit ? { ...s.edit, hasStatus: !!(s.edit.statuses && s.edit.statuses.length), ownerLabel: ['judg', 'agrs', 'cases'].indexOf(s.edit.table) >= 0 ? 'עו״ד מטפלת' : 'אחראית', canDel: !!s.edit.id && !s.edit.isNew, owner: s.edit.owner || '' } : { statuses: [] },
      closeEdit: () => this.setState({ edit: null }),
      edNum: (e) => this.setState({ edit: { ...this.state.edit, num: e.target.value } }),
      edName: (e) => this.setState({ edit: { ...this.state.edit, name: e.target.value } }),
      edOwner: (e) => this.setState({ edit: { ...this.state.edit, owner: e.target.value } }),
      edStatus: (e) => this.setState({ edit: { ...this.state.edit, status: e.target.value } }),
      edNote: (e) => this.setState({ edit: { ...this.state.edit, note: e.target.value } }),
      edType: (e) => this.setState({ edit: { ...this.state.edit, type: e.target.value } }),
      edDesc: (e) => this.setState({ edit: { ...this.state.edit, desc: e.target.value } }),
      edD1: (e) => this.setState({ edit: { ...this.state.edit, d1: e.target.value } }),
      edD2: (e) => this.setState({ edit: { ...this.state.edit, d2: e.target.value } }),
      saveEdit: () => {
        const e = this.state.edit, T = e.table;
        if (!String(e.name || '').trim() && !String(e.num || '').replace('1614/', '').trim()) { this.say('יש למלא לפחות שם או מספר תיק'); return; }
        const row = { num: String(e.num || '').trim(), name: String(e.name || '').trim(), note: e.note || '' };
        if (e.hasOwner) row[e.ownerField || 'owner'] = e.owner;
        if (e.statuses && e.statuses.length) row.status = e.status;
        if (e.hasType) row.type = e.type;
        if (e.hasDesc) row.desc = e.desc;
        if (e.d1Key) row[e.d1Key] = e.d1 || '';
        if (e.d2Key) row[e.d2Key] = e.d2 || '';
        const st = this.state;
        if (e.isNew) {
          const id = T.slice(0, 2) + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
          const upd = { edit: null };
          if (T === 'cases') upd.cases = st.cases.concat([{ id, ...row, src: 'ידני', openedISO: iso(today) }]);
          else upd.db = { ...st.db, [T]: (st.db[T] || []).concat([{ id, ...row }]) };
          if (T === 'judg' && e.d1) upd.jd = { ...st.jd, [id]: { servedISO: e.d1, stage: 0 } };
          this.setState(upd);
          this.say('נוסף: ' + (row.name || row.num));
          return;
        }
        const upd = { edit: null, over: { ...st.over, [e.id]: { ...(st.over[e.id] || {}), ...row } } };
        if (T === 'judg') upd.jd = { ...st.jd, [e.id]: { ...(st.jd[e.id] || { stage: 0 }), servedISO: e.d1 || null } };
        this.setState(upd);
        this.say('השינויים נשמרו · ' + (row.name || row.num));
      },
      delEdit: () => { const e = s.edit; this.setState({ edit: null, removed: { ...s.removed, [e.id]: true } }); this.say('נמחק: ' + (e.name || e.num), e.id); },
      hasUndo: !!s.undo, doUndo: () => { const id = s.undo; this.setState({ removed: { ...s.removed, [id]: false }, undo: null, toast: '' }); this.say('השורה שוחזרה'); },
      has360: !!c360, c360: c360 || { items: [] }, close360: () => this.setState({ c360: null }),
      hasToast: !!s.toast, toast: s.toast,
      print: () => window.print(),
      newItem: () => { if (P === 'rules') { this.say('בעמוד זה אין טבלה להוספה'); return; } this.setState({ edit: edCfg(P === 'home' ? 'cases' : P, {}, true) }); },
      rootCls: s.report ? 'reporting' : '',
      showReport: !!s.report, reportDate: fmtL(today), reportGroups, reportTotal, noReport: reportGroups.length === 0,
      printReport: () => { this.setState({ report: true }); setTimeout(() => { window.print(); this.setState({ report: false }); }, 120); },
      exportData: () => {
        const keep = window.DCLogic.persistable(this.state);
        const blob = new Blob([JSON.stringify({ app: 'legal-system', version: 1, exported: new Date().toISOString(), state: keep }, null, 1)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'גיבוי-מערכת-תיקים-' + iso(today) + '.json';
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        this.say('קובץ הגיבוי ירד למחשב');
      },
      importData: (e) => {
        const input = e.target, f = input.files && input.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          try {
            const o = JSON.parse(rd.result);
            if (o.state && typeof o.state === 'object') { this.setState({ ...o.state, more: false }); this.say('הגיבוי שוחזר בהצלחה'); }
            else if (o.db && typeof o.db === 'object') {
              const cur = this.state.db, nd = { ...cur }; let n = 0;
              Object.keys(o.db).forEach((k) => { if (Array.isArray(o.db[k])) { const ids = new Set((cur[k] || []).map((x) => x.id)); const add = o.db[k].filter((x) => !ids.has(x.id)); n += add.length; nd[k] = (cur[k] || []).concat(add); } });
              this.setState({ db: nd, more: false }); this.say('יובאו ' + n + ' שורות');
            } else this.say('הקובץ לא מתאים למערכת');
          } catch (err) { this.say('לא ניתן לקרוא את הקובץ'); }
          input.value = '';
        };
        rd.readAsText(f, 'utf-8');
      }
    };
  }
}
