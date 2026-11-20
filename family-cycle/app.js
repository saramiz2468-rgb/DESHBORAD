import {
  analyze, validateCycle, localToday, formatDate, ageFrom, addDays, diffDays, toDay, fromDay,
  bleedDays, OPEN_PERIOD_DAYS,
} from './calc.js';
import { createStore } from './store.js';

// ======================================================================
// כלים
// ======================================================================
const $app = document.getElementById('app');
const $modalRoot = document.getElementById('modal-root');
const $toast = document.getElementById('toast');

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const DOW = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

const ICON = {
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M4 20h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M9 18l6-6-6-6"/>',
  chevL: '<path d="M15 18l-6-6 6-6"/>',
  chevR: '<path d="M9 18l6-6-6-6"/>',
  drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkle: '<path d="M12 3l1.8 4.9L19 9.7l-4.6 2.6L13 18l-1-5.4L7 10l5-1.5z"/><path d="M19 15l.7 1.8L21.5 18l-1.8.7L19 20.5l-.7-1.8L16.5 18l1.8-.7z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  sort: '<path d="M8 4v16M4 16l4 4 4-4M16 20V4M12 8l4-4 4 4"/>',
  flower: '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5C12 6 10 4 12 3c2 1 0 3 0 6.5zM14.5 12c3.5 0 5.5-2 6.5 0-1 2-3 0-6.5 0zM12 14.5c0 3.5 2 5.5 0 6.5-2-1 0-3 0-6.5zM9.5 12C6 12 4 14 3 12c1-2 3 0 6.5 0z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

function toast(msg, isErr = false) {
  $toast.textContent = msg;
  $toast.classList.toggle('err', isErr);
  $toast.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => $toast.classList.remove('show'), 3200);
}

function hebrewLongDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, d)));
}
function hebrewShortDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}
const daysWord = (n) => (n === 1 ? 'יום אחד' : n === 2 ? 'יומיים' : `${n} ימים`);
const numFmt = (n) => (n == null ? '—' : Number.isInteger(n) ? String(n) : n.toFixed(1));

// ======================================================================
// שמירה מקומית ומצב
// ======================================================================
const store = createStore();

const state = {
  current: null, // { daughter, cycles }
  calMonth: null, // 'YYYY-MM'
  selectedDay: null,
  sortDir: 'desc',
  menuOpen: false,
};

const today = () => localToday();
const data = () => store.get();

function route() {
  const m = /^#\/d\/(\d+)$/.exec(location.hash);
  return m ? { name: 'daughter', id: Number(m[1]) } : { name: 'home' };
}

function loadDaughter(id) {
  const daughter = store.getDaughter(id);
  const switched = !state.current || state.current.daughter.id !== id;
  state.current = { daughter, cycles: daughter.cycles };
  if (switched) {
    state.calMonth = today().slice(0, 7);
    state.selectedDay = null;
  }
}

function render() {
  closeMenu();
  if (store.isLocked()) return showLock('unlock');
  if (!data().onboarded) return renderOnboarding();
  const r = route();
  if (r.name === 'daughter') {
    try {
      loadDaughter(r.id);
    } catch {
      toast('הפרופיל לא נמצא', true);
      location.hash = '#/';
      return;
    }
    renderDaughter();
  } else {
    state.current = null;
    renderHome();
  }
}

/** מריץ פעולת שמירה ומציג שגיאה אם נכשלה */
async function run(fn, okMsg) {
  try {
    const out = await fn();
    if (okMsg) toast(okMsg);
    return out;
  } catch (e) {
    toast(e.message, true);
    throw e;
  }
}

// ======================================================================
// מסך פתיחה (פעם ראשונה)
// ======================================================================
function renderOnboarding() {
  $app.innerHTML = `
  <main id="main" class="auth-wrap">
    <div class="auth-card">
      <div class="auth-head">
        <img src="icons/icon.svg" alt="">
        <h1>המעקב המשפחתי שלי</h1>
        <p>מקום אחד, רגוע ומסודר, למעקב המחזור של כל אחת מהבנות</p>
      </div>
      <form id="onb-form" novalidate>
        <div class="field"><label for="o-name">איך לקרוא לך? <span class="muted small">(אופציונלי)</span></label>
          <input class="input" id="o-name" name="name" autocomplete="given-name" maxlength="40" placeholder="למשל: אמא"></div>
        <label class="check"><input type="checkbox" name="demo" checked> להוסיף נתוני הדגמה כדי לראות איך זה נראה (אפשר למחוק בכל רגע)</label>
        <label class="check"><input type="checkbox" name="pin" checked> לנעול בקוד אישי (מומלץ). הנתונים יוצפנו במכשיר</label>
        <button class="btn btn-primary btn-block" type="submit">התחלה</button>
      </form>
      <div class="privacy-note">${icon('lock')}<span>אין הרשמה ואין שרת. כל המידע נשמר רק במכשיר הזה, ולא נשלח לשום מקום.</span></div>
    </div>
  </main>`;
  const form = document.getElementById('onb-form');
  form.querySelector('input').focus();
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    try {
      await store.completeOnboarding({ motherName: fd.get('name'), demo: fd.get('demo') === 'on', today: today() });
    } catch (e) {
      return toast(e.message, true);
    }
    location.hash = '#/';
    render();
    if (fd.get('pin') === 'on') showLock('set');
    else toast('ברוכה הבאה 🌸');
  });
}

// ======================================================================
// נעילה בקוד אישי
// ======================================================================
const $lock = document.getElementById('lock');
let pinBuf = '';
let pinMode = null;
let pinFirst = '';
let lastActive = Date.now();

function showLock(mode) {
  pinMode = mode;
  pinBuf = '';
  pinFirst = '';
  closeModal();
  $lock.hidden = false;
  $app.setAttribute('aria-hidden', 'true');
  if (mode === 'unlock') $app.innerHTML = '';
  drawLock();
}

function hideLock() {
  $lock.hidden = true;
  $lock.innerHTML = '';
  $app.removeAttribute('aria-hidden');
}

function drawLock(msg, shakeIt = false) {
  const titles = {
    unlock: 'הזיני את הקוד האישי',
    set: 'בחרי קוד בן 4–6 ספרות',
    confirm: 'הזיני שוב את הקוד לאישור',
  };
  $lock.innerHTML = `
    <img src="icons/icon.svg" alt="" class="lock-logo">
    <h1>המעקב המשפחתי שלי</h1>
    <p class="lock-msg ${msg ? 'err' : ''}" role="status">${esc(msg || titles[pinMode])}</p>
    <div class="pin-dots ${shakeIt ? 'shake' : ''}" aria-hidden="true">
      ${[0, 1, 2, 3, 4, 5].map((i) => `<i class="${i < pinBuf.length ? 'on' : ''} ${i >= 4 ? 'opt' : ''}"></i>`).join('')}
    </div>
    <div class="keypad">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-pin="${n}" aria-label="${n}">${n}</button>`).join('')}
      <button data-pin="${pinMode === 'unlock' ? 'del' : 'cancel'}" class="kp-text">${pinMode === 'unlock' ? 'מחיקה' : 'ביטול'}</button>
      <button data-pin="0" aria-label="0">0</button>
      <button data-pin="ok" class="kp-text kp-ok">אישור</button>
    </div>
    ${pinMode === 'unlock' ? '<button class="link lock-forgot" data-pin="forgot">שכחתי את הקוד</button>' : ''}`;
}

function shake(msg) {
  pinBuf = '';
  drawLock(msg, true);
}

async function pinKey(k) {
  if (k === 'forgot') {
    const ok = await confirmDialog({
      title: 'איפוס האפליקציה',
      text: 'בלי הקוד אי אפשר לפענח את הנתונים המוצפנים. איפוס ימחק את כל הנתונים במכשיר. אם יש לך קובץ גיבוי, תוכלי לשחזר ממנו אחר כך.',
      okText: 'מחיקת הכל והתחלה מחדש',
    });
    if (ok) { store.wipe(); hideLock(); location.hash = '#/'; render(); }
    return;
  }
  if (k === 'cancel') { hideLock(); render(); return; }
  if (k === 'del') { pinBuf = pinBuf.slice(0, -1); return drawLock(); }
  if (k === 'ok') return pinSubmit();
  if (pinBuf.length >= 6) return;
  pinBuf += k;
  drawLock();
  if (pinMode === 'unlock') {
    const len = store.pinLength();
    if (len ? pinBuf.length === len : pinBuf.length >= 4) tryUnlock(!len);
  }
}

let unlocking = false;
async function tryUnlock(silent) {
  if (unlocking) return;
  unlocking = true;
  const attempt = pinBuf;
  const ok = await store.unlock(attempt);
  unlocking = false;
  if (ok) {
    hideLock();
    lastActive = Date.now();
    render();
  } else if (!silent || attempt.length >= 6) {
    shake('הקוד שגוי');
  }
}

async function pinSubmit() {
  if (pinMode === 'unlock') return tryUnlock(false);
  if (pinBuf.length < 4) return shake('הקוד צריך לכלול 4 ספרות לפחות');
  if (pinMode === 'set') {
    pinFirst = pinBuf;
    pinBuf = '';
    pinMode = 'confirm';
    return drawLock();
  }
  if (pinMode === 'confirm') {
    if (pinBuf !== pinFirst) { pinMode = 'set'; return shake('הקודים אינם תואמים. נסי שוב'); }
    try {
      await store.setPin(pinBuf);
    } catch (e) {
      return shake(e.message);
    }
    hideLock();
    render();
    toast('הנעילה הופעלה והנתונים הוצפנו');
  }
}

function lockNow() {
  if (!store.lock()) {
    toast('כדי לנעול, הפעילי קוד אישי בהגדרות');
    return settingsForm();
  }
  state.current = null;
  showLock('unlock');
}

$lock.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-pin]');
  if (b) pinKey(b.dataset.pin);
});
document.addEventListener('keydown', (ev) => {
  if ($lock.hidden || $modalRoot.innerHTML) return;
  if (/^\d$/.test(ev.key)) pinKey(ev.key);
  else if (ev.key === 'Backspace') { pinBuf = pinBuf.slice(0, -1); drawLock(); }
  else if (ev.key === 'Enter') pinSubmit();
});

// נעילה אוטומטית כשהאפליקציה ברקע
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    lastActive = Date.now();
  } else if (!store.isLocked() && data().pinEnabled && $lock.hidden &&
    Date.now() - lastActive >= (data().settings.autoLockMin || 0) * 60000) {
    lockNow();
  }
});

// ======================================================================
// מעטפת עם סרגל עליון
// ======================================================================
function shell(content) {
  const d = data();
  const hasDemo = store.hasDemo();
  return `
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="#/"><img src="icons/icon.svg" alt=""><span>המעקב המשפחתי שלי</span></a>
      <div class="spacer"></div>
      ${d.pinEnabled ? `<button class="btn btn-ghost btn-icon" data-action="lock-now" aria-label="נעילה">${icon('lock')}</button>` : ''}
      <div class="menu">
        <button class="btn btn-ghost btn-sm" data-action="menu" aria-haspopup="true" aria-expanded="${state.menuOpen}">
          ${icon('settings')}<span>תפריט</span></button>
        <div class="menu-pop" ${state.menuOpen ? '' : 'hidden'}>
          <button data-action="settings">${icon('settings')}הגדרות ופרטיות</button>
          <button data-action="backup">${icon('download')}גיבוי לקובץ</button>
          <button data-action="restore">${icon('upload')}שחזור מגיבוי</button>
          ${hasDemo ? `<button data-action="demo-delete">${icon('trash')}מחיקת נתוני הדגמה</button>` : `<button data-action="demo-load">${icon('sparkle')}טעינת נתוני הדגמה</button>`}
          ${d.pinEnabled ? `<button data-action="lock-now">${icon('lock')}נעילה</button>` : ''}
        </div>
      </div>
    </div>
  </header>
  <main id="main" class="container">${content}</main>
  <footer class="foot">כל המידע נשמר רק במכשיר הזה${d.pinEnabled ? ' ומוצפן בקוד אישי' : ''}. המידע נועד למעקב אישי ואינו מהווה ייעוץ רפואי. תחזיות הן הערכה בלבד.</footer>`;
}

function avatar(d, size = '') {
  const inner = d.photo ? `<img src="${esc(d.photo)}" alt="">` : esc((d.name || '?').trim().charAt(0));
  return `<div class="avatar ${size} accent-${d.color ?? 0}" aria-hidden="true">${inner}</div>`;
}

function statusBadge(a) {
  if (a.status === 'period') return '<span class="badge badge-period">במחזור</span>';
  if (a.status === 'between') return '<span class="badge badge-between">בין מחזורים</span>';
  return '<span class="badge badge-none">אין עדיין רישום</span>';
}

function greeting(name) {
  const h = new Date().getHours();
  const g = h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב';
  return name ? `${g}, ${esc(name)} 🌸` : `${g} 🌸`;
}

// ======================================================================
// מסך ראשי – המשפחה שלי
// ======================================================================
function predictionText(a, short = false) {
  const p = a.prediction;
  if (!p) return null;
  if (p.overdue) return `${formatDate(p.date)} · ${short ? 'עבר' : 'עבר המועד המשוער לפני'} ${daysWord(p.overdue)}`;
  if (p.daysUntil === 0) return `${formatDate(p.date)} · היום`;
  return `${formatDate(p.date)} · בעוד ${daysWord(p.daysUntil)}`;
}

function daughterCard(d) {
  const t = today();
  const a = analyze(d.cycles, t);
  const age = ageFrom(d.birthDate, t);
  const last = a.last;
  const pred = predictionText(a, true);
  return `
  <button class="d-card accent-${d.color ?? 0}" data-action="open" data-id="${d.id}" aria-label="מעבר למעקב של ${esc(d.name)}">
    <div class="d-card-head">
      ${avatar(d)}
      <div>
        <h2>${esc(d.name)}</h2>
        ${age != null ? `<span class="age">בת ${age}</span>` : ''}
      </div>
      <span class="chev">${icon('chevL')}</span>
    </div>
    <div>${statusBadge(a)}${d.isDemo ? ' <span class="est">הדגמה</span>' : ''}</div>
    <div class="d-facts">
      <div class="fact"><span class="k">מחזור אחרון</span><span class="v">${last ? formatDate(last.start) : '—'}</span></div>
      <div class="fact"><span class="k">ימים מאז תחילתו</span><span class="v">${a.daysSinceStart != null ? a.daysSinceStart : '—'}</span></div>
      <div class="fact wide"><span class="k">מחזור הבא המשוער</span>
        <span class="v">${pred ? `${esc(pred)}<span class="est">הערכה</span>` : `<span class="muted small">${a.count ? `נדרשים עוד ${a.neededForPrediction === 1 ? 'מחזור אחד' : a.neededForPrediction + ' מחזורים'} לתחזית` : 'עדיין אין נתונים'}</span>`}</span></div>
    </div>
  </button>`;
}

function renderHome() {
  const ds = store.listDaughters();
  const t = today();
  const content = `
    <section class="hero">
      <div>
        <h1>המעקב המשפחתי שלי</h1>
        <p class="greet">${greeting(data().motherName)}</p>
        <div class="date">${esc(hebrewLongDate(t))}</div>
      </div>
      <button class="btn btn-primary" data-action="add-daughter">${icon('plus')}הוספת בת</button>
    </section>
    ${store.hasDemo() ? `
    <div class="demo-banner">${icon('sparkle')}
      <span class="grow">מוצגים כרגע נתוני הדגמה, רק כדי להכיר את הממשק. הנתונים שתזיני ישמרו גם אחרי המחיקה.</span>
      <button class="btn btn-lilac btn-sm" data-action="demo-delete">מחיקת נתוני הדגמה</button>
    </div>` : ''}
    ${ds.length ? `
    <section class="grid-cards" aria-label="הבנות">
      ${ds.map(daughterCard).join('')}
      <button class="add-card" data-action="add-daughter"><span class="plus">${icon('plus')}</span>הוספת בת</button>
    </section>` : `
    <section class="card empty">
      <div class="art">${icon('heart')}</div>
      <h2>עוד לא הוספת בנות</h2>
      <p>הוסיפי פרופיל לכל אחת מהבנות. לכל פרופיל יש מעקב נפרד לגמרי – תאריכים, היסטוריה ותחזיות.</p>
      <div class="form-actions">
        <button class="btn btn-primary" data-action="add-daughter">${icon('plus')}הוספת בת</button>
        <button class="btn btn-lilac" data-action="demo-load">${icon('sparkle')}לראות עם נתוני הדגמה</button>
      </div>
    </section>`}`;
  $app.innerHTML = shell(content);
}

// ======================================================================
// מסך אישי לבת
// ======================================================================
function renderDaughter() {
  const { daughter: d, cycles } = state.current;
  const t = today();
  const a = analyze(cycles, t);
  const age = ageFrom(d.birthDate, t);
  const last = a.last;

  const predBlock = a.prediction ? `
    <section class="prediction">
      <div class="ico">${icon('sparkle')}</div>
      <div class="txt">
        <div class="muted small">המחזור הבא המשוער <span class="est">הערכה בלבד</span></div>
        <strong>${esc(hebrewLongDate(a.prediction.date))}</strong>
        <div class="small">${a.prediction.overdue ? `עבר המועד המשוער לפני ${daysWord(a.prediction.overdue)}` : a.prediction.daysUntil === 0 ? 'היום' : `בעוד ${daysWord(a.prediction.daysUntil)}`}
          · טווח סביר ${formatDate(a.prediction.from)}–${formatDate(a.prediction.to)}</div>
        <div class="disclaimer">מחושב לפי ממוצע ${a.prediction.basedOn} המחזורים האחרונים (${numFmt(a.avgCycle)} ימים). זהו אינו תאריך ודאי.</div>
      </div>
    </section>` : `
    <section class="prediction">
      <div class="ico">${icon('info')}</div>
      <div class="txt"><strong>${a.count ? 'עדיין אין מספיק נתונים לתחזית' : 'עדיין אין מחזורים רשומים'}</strong>
        <div class="small muted">${a.count
          ? `תחזית תוצג לאחר שיירשמו לפחות 3 מחזורים (נדרשים עוד ${a.neededForPrediction === 1 ? 'מחזור אחד' : a.neededForPrediction + ' מחזורים'}).`
          : 'לחצי על "הזנת מחזור חדש" כדי להתחיל את המעקב.'}</div></div>
    </section>`;

  const lastBleed = last ? bleedDays(last) : null;
  const stat = (ic, k, v, sub = '', cls = '') =>
    `<div class="stat ${cls}"><div class="k">${icon(ic)}${k}</div><div class="v">${v}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;

  const content = `
    <button class="btn btn-ghost btn-sm back" data-action="home">${icon('back')}חזרה לרשימת הבנות</button>
    <section class="profile-head accent-${d.color ?? 0}">
      ${avatar(d, 'avatar-lg')}
      <div class="who">
        <h1>${esc(d.name)}</h1>
        <div class="meta">${age != null ? `<span>בת ${age}</span>·` : ''}${statusBadge(a)}${d.isDemo ? '<span class="est">פרופיל הדגמה</span>' : ''}</div>
      </div>
      <div class="head-actions">
        <button class="btn btn-primary" data-action="new-cycle">${icon('plus')}הזנת מחזור חדש</button>
        <button class="btn btn-soft" data-action="edit-daughter">${icon('edit')}עריכת פרטים</button>
      </div>
    </section>

    ${predBlock}

    <section class="stats" aria-label="נתוני המחזור">
      ${stat('cal', 'תחילת המחזור האחרון', last ? formatDate(last.start) : '—')}
      ${stat('cal', 'סיום המחזור האחרון', last ? (last.end ? formatDate(last.end) : '<small>טרם הוזן</small>') : '—')}
      ${stat('drop', 'משך הדימום האחרון', lastBleed != null ? `${lastBleed} <small>ימים</small>` : '—', a.avgBleed != null ? `ממוצע: ${numFmt(a.avgBleed)} ימים` : '')}
      ${stat('clock', 'אורך מחזור ממוצע', a.avgCycle != null ? `${numFmt(a.avgCycle)} <small>ימים</small>` : '—',
        a.minCycle != null ? (a.minCycle === a.maxCycle ? `לפי מחזור אחד` : `טווח ${a.minCycle}–${a.maxCycle} ימים`) : 'נדרשים 2 מחזורים לפחות')}
      ${stat('flower', 'יום במחזור הנוכחי', a.cycleDay != null ? `יום ${a.cycleDay}` : '—', a.daysSinceStart != null ? `${daysWord(a.daysSinceStart)} מאז תחילתו` : '', 'highlight')}
      ${stat('sparkle', 'המחזור הבא המשוער', a.prediction ? formatDate(a.prediction.date) : '—', a.prediction ? 'הערכה בלבד' : 'אין מספיק נתונים')}
    </section>

    <div class="layout-2">
      <section class="card" aria-label="לוח שנה">
        <div class="card-title"><span class="ico">${icon('cal')}</span>לוח שנה</div>
        <div id="calendar">${calendarHTML(a)}</div>
      </section>
      <section class="card" aria-label="גרפים">
        <div class="card-title"><span class="ico">${icon('chart')}</span>מגמות</div>
        <div class="charts">${chartsHTML(a)}</div>
      </section>
    </div>

    <section class="card" aria-label="היסטוריית מחזורים">
      <div class="card-title"><span class="ico">${icon('list')}</span>היסטוריית מחזורים <span class="muted small">(${a.count})</span>
        <span class="actions"><button class="btn btn-ghost btn-sm" data-action="sort">${icon('sort')}${state.sortDir === 'desc' ? 'מהחדש לישן' : 'מהישן לחדש'}</button></span>
      </div>
      ${historyHTML(a)}
    </section>`;
  $app.innerHTML = shell(content);
  bindChartTips();
}

// ---------- לוח שנה ----------
function dayMap(a, t) {
  const map = new Map();
  const rows = a.rows;
  rows.forEach((c, idx) => {
    let endDay;
    if (c.end) endDay = toDay(c.end);
    else if (idx === rows.length - 1 && diffDays(c.start, t) >= 0 && diffDays(c.start, t) < OPEN_PERIOD_DAYS) endDay = toDay(t);
    else endDay = toDay(c.start);
    for (let n = toDay(c.start); n <= endDay; n++) {
      const iso = fromDay(n);
      map.set(iso, {
        kind: 'period', cycle: c,
        isStart: iso === c.start, isEnd: !!c.end && iso === c.end,
        dayNo: n - toDay(c.start) + 1,
      });
    }
  });
  const p = a.prediction;
  if (p && !p.overdue) {
    for (let i = 0; i < p.expectedBleed; i++) {
      const iso = addDays(p.date, i);
      if (!map.has(iso)) map.set(iso, { kind: 'predicted', first: i === 0 });
    }
  }
  return map;
}

function calendarHTML(a) {
  const t = today();
  const [y, m] = state.calMonth.split('-').map(Number);
  const first = `${state.calMonth}-01`;
  const startDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const gridStart = addDays(first, -startDow);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = Math.ceil((startDow + daysInMonth) / 7) * 7;
  const map = dayMap(a, t);
  let html = `
    <div class="cal-head">
      <button class="btn btn-ghost btn-icon" data-action="cal-prev" aria-label="החודש הקודם">${icon('chevR')}</button>
      <h3 aria-live="polite">${MONTHS[m - 1]} ${y}</h3>
      <button class="btn btn-ghost btn-icon" data-action="cal-next" aria-label="החודש הבא">${icon('chevL')}</button>
    </div>
    <div class="cal-grid" role="grid">
      ${DOW.map((d) => `<div class="cal-dow" role="columnheader">${d}</div>`).join('')}`;
  for (let i = 0; i < cells; i++) {
    const iso = addDays(gridStart, i);
    const info = map.get(iso);
    const cls = ['cal-day'];
    let mk = '';
    let label = hebrewShortDate(iso);
    if (!iso.startsWith(state.calMonth)) cls.push('out');
    if (info?.kind === 'period') {
      cls.push('period');
      if (info.isStart) { cls.push('p-start'); mk = 'התחלה'; }
      if (info.isEnd) { cls.push('p-end'); mk = info.isStart ? 'יום 1' : 'סיום'; }
      label += `, יום ${info.dayNo} במחזור`;
    } else if (info?.kind === 'predicted') {
      cls.push('predicted');
      if (info.first) cls.push('predicted-center');
      label += ', מחזור משוער (הערכה)';
    }
    if (iso === t) { cls.push('today'); label += ', היום'; }
    if (iso === state.selectedDay) cls.push('selected');
    const note = info?.kind === 'period' && info.isStart && info.cycle.notes ? '<i class="note-dot"></i>' : '';
    html += `<button class="${cls.join(' ')}" data-action="day" data-day="${iso}" aria-label="${esc(label)}">${Number(iso.slice(8))}${mk ? `<span class="mk">${mk}</span>` : ''}${note}</button>`;
  }
  html += `</div>
    <div class="cal-legend">
      <span><i class="lg-start"></i>תחילת מחזור</span><span><i class="lg-period"></i>ימי מחזור</span>
      <span><i class="lg-end"></i>סיום</span><span><i class="lg-pred"></i>משוער (הערכה)</span><span><i class="lg-today"></i>היום</span>
    </div>
    ${dayDetailHTML(a, map)}`;
  return html;
}

function dayDetailHTML(a, map) {
  const iso = state.selectedDay;
  if (!iso) return '<p class="muted small">לחצי על יום כדי לראות את פרטי המחזור.</p>';
  const info = map.get(iso);
  const t = today();
  const head = `<h4>${esc(hebrewLongDate(iso))}</h4>`;
  if (info?.kind === 'period') {
    const c = info.cycle;
    return `<div class="day-detail">${head}
      <p><strong>מחזור מס׳ ${c.number}</strong> · יום ${info.dayNo}${c.bleed ? ` מתוך ${c.bleed}` : ''}</p>
      <p>התחלה: ${formatDate(c.start)} · סיום: ${c.end ? formatDate(c.end) : 'טרם הוזן'}</p>
      ${c.sincePrev != null ? `<p>${c.sincePrev} ימים מתחילת המחזור הקודם</p>` : ''}
      ${c.notes ? `<p>הערות: ${esc(c.notes)}</p>` : ''}
      <div class="form-actions"><button class="btn btn-soft btn-sm" data-action="edit-cycle" data-id="${c.id}">${icon('edit')}עריכת המחזור</button></div>
    </div>`;
  }
  const canStart = toDay(iso) <= toDay(t);
  const predicted = info?.kind === 'predicted'
    ? '<p>יום זה נמצא בטווח המחזור המשוער. <span class="est">הערכה בלבד</span></p>' : '<p class="muted">אין רישום מחזור ביום זה.</p>';
  return `<div class="day-detail">${head}${predicted}
    ${canStart ? `<div class="form-actions"><button class="btn btn-soft btn-sm" data-action="new-cycle" data-day="${iso}">${icon('plus')}התחלת מחזור ביום זה</button></div>` : ''}
  </div>`;
}

// ---------- גרפים (SVG) ----------
function barChart({ items, avg, unit, alt, emptyMsg }) {
  if (!items.length) return `<div class="chart-empty small">${emptyMsg}</div>`;
  const W = 520, H = 190, padTop = 22, padBottom = 28, padSide = 12, padRight = 70;
  const max = Math.max(...items.map((i) => i.value), avg || 0);
  const step = max > 12 ? 10 : 2;
  const top = Math.max(step * 2, Math.ceil((max * 1.1) / (step * 2)) * step * 2);
  const plotH = H - padTop - padBottom;
  const slot = (W - padSide - padRight) / items.length;
  const bw = Math.min(24, slot * 0.6);
  const y = (v) => padTop + plotH - (v / top) * plotH;
  const ticks = [0, Math.round(top / 2), top];
  let svg = `<svg viewBox="0 0 ${W} ${H}" direction="ltr" role="img" aria-label="גרף ${unit}">`;
  for (const tk of ticks) {
    svg += `<line class="grid-line" x1="${padSide}" x2="${W - padRight}" y1="${y(tk)}" y2="${y(tk)}"/>`;
    if (!avg || Math.abs(y(tk) - y(avg)) > 12) {
      svg += `<text class="axis-text" x="${W - padRight + 6}" y="${y(tk) + 4}" text-anchor="start">${tk}</text>`;
    }
  }
  // סדר כרונולוגי מימין לשמאל, בהתאם לכיוון הקריאה
  items.forEach((it, i) => {
    const cx = W - padRight - slot * (i + 0.5);
    const h = Math.max(2, (it.value / top) * plotH);
    const x = cx - bw / 2, yy = padTop + plotH - h, r = Math.min(4, bw / 2);
    const path = `M${x},${padTop + plotH} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${padTop + plotH} Z`;
    const tip = `${it.tip}: ${it.value} ${unit}`;
    svg += `<rect class="hit" x="${cx - slot / 2}" y="${padTop}" width="${slot}" height="${plotH}" data-tip="${esc(tip)}" data-bar="${i}"><title>${esc(tip)}</title></rect>`;
    svg += `<path class="bar ${alt ? 'alt' : ''}" data-bar-mark="${i}" d="${path}"/>`;
    if (i === items.length - 1 || items.length <= 6) {
      svg += `<text class="val-text" x="${cx}" y="${yy - 5}" text-anchor="middle">${it.value}</text>`;
    }
    if (items.length <= 8 || i % 2 === 0 || i === items.length - 1) {
      svg += `<text class="axis-text" x="${cx}" y="${H - 8}" text-anchor="middle">${esc(it.label)}</text>`;
    }
  });
  if (avg) {
    svg += `<line class="avg-line" x1="${padSide}" x2="${W - padRight}" y1="${y(avg)}" y2="${y(avg)}"/>`;
    svg += `<text class="avg-text" x="${W - padRight + 6}" y="${y(avg) + 4}" text-anchor="start">ממוצע ${numFmt(avg)}</text>`;
  }
  return `<div class="chart-wrap">${svg}</svg><div class="chart-tip" hidden></div></div>`;
}

function chartsHTML(a) {
  const shortD = (iso) => `${iso.slice(8)}.${iso.slice(5, 7)}`;
  const lengths = a.rows.filter((r) => r.length != null).slice(-12)
    .map((r) => ({ value: r.length, label: shortD(r.start), tip: `מחזור ${r.number} (${formatDate(r.start)})` }));
  const bleeds = a.rows.filter((r) => r.bleed != null).slice(-12)
    .map((r) => ({ value: r.bleed, label: shortD(r.start), tip: `מחזור ${r.number} (${formatDate(r.start)})` }));
  return `
    <div>
      <div class="chart-label">אורך המחזור</div>
      <div class="chart-sub">ימים מתחילת מחזור אחד לתחילת הבא</div>
      ${barChart({ items: lengths, avg: a.avgCycle, unit: 'ימים', emptyMsg: 'הגרף יוצג אחרי שיירשמו לפחות 2 מחזורים' })}
    </div>
    <div>
      <div class="chart-label">משך הדימום</div>
      <div class="chart-sub">ימים, כולל יום ההתחלה ויום הסיום</div>
      ${barChart({ items: bleeds, avg: a.avgBleed, unit: 'ימים', alt: true, emptyMsg: 'הגרף יוצג אחרי שיוזנו תאריכי סיום' })}
    </div>`;
}

function bindChartTips() {
  document.querySelectorAll('.chart-wrap').forEach((wrap) => {
    const tip = wrap.querySelector('.chart-tip');
    const svg = wrap.querySelector('svg');
    const clear = () => {
      tip.hidden = true;
      wrap.querySelectorAll('.bar.on').forEach((b) => b.classList.remove('on'));
    };
    wrap.addEventListener('pointerover', (ev) => {
      const hit = ev.target.closest('.hit');
      if (!hit) return;
      clear();
      wrap.querySelector(`[data-bar-mark="${hit.dataset.bar}"]`)?.classList.add('on');
      const box = hit.getBoundingClientRect();
      const wbox = wrap.getBoundingClientRect();
      tip.textContent = hit.dataset.tip;
      tip.hidden = false;
      tip.style.right = `${wbox.right - (box.left + box.width / 2)}px`;
      tip.style.top = `${box.top - wbox.top + 18}px`;
    });
    svg.addEventListener('pointerleave', clear);
  });
}

// ---------- טבלת היסטוריה ----------
function historyHTML(a) {
  if (!a.rows.length) {
    return `<div class="chart-empty">אין עדיין מחזורים רשומים. <button class="link" data-action="new-cycle">הזנת מחזור ראשון</button></div>`;
  }
  const t = today();
  const rows = state.sortDir === 'desc' ? [...a.rows].reverse() : a.rows;
  const lastId = a.last.id;
  return `
  <div class="table-wrap">
    <table class="history">
      <thead><tr>
        <th>מס׳</th>
        <th><button data-action="sort" aria-label="מיון לפי תאריך">תאריך התחלה ${icon('sort')}</button></th>
        <th>תאריך סיום</th><th>משך הדימום</th><th>ימים מהמחזור הקודם</th><th>הערות</th><th><span class="sr-only">פעולות</span></th>
      </tr></thead>
      <tbody>
      ${rows.map((r) => {
        const open = !r.end && r.id === lastId && diffDays(r.start, t) < OPEN_PERIOD_DAYS;
        return `<tr>
          <td data-label="מס׳"><span class="num">${r.number}</span></td>
          <td data-label="תאריך התחלה">${formatDate(r.start)}</td>
          <td data-label="תאריך סיום">${r.end ? formatDate(r.end) : open ? '<span class="pill-open">בתהליך</span>' : '<span class="muted">לא הוזן</span>'}</td>
          <td data-label="משך הדימום">${r.bleed != null ? daysWord(r.bleed) : '—'}</td>
          <td data-label="ימים מהמחזור הקודם">${r.sincePrev != null ? r.sincePrev : '—'}</td>
          <td data-label="הערות" class="notes">${r.notes ? esc(r.notes) : '<span class="muted">—</span>'}</td>
          <td class="acts">
            <button class="btn btn-soft btn-sm" data-action="edit-cycle" data-id="${r.id}" aria-label="עריכת מחזור ${r.number}">${icon('edit')}עריכה</button>
            <button class="btn btn-danger btn-sm btn-icon" data-action="delete-cycle" data-id="${r.id}" aria-label="מחיקת מחזור ${r.number}">${icon('trash')}</button>
          </td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>
  </div>`;
}

// ======================================================================
// חלונות קופצים
// ======================================================================
let lastFocus = null;
function openModal(html, onMount) {
  lastFocus = document.activeElement;
  $modalRoot.innerHTML = `<div class="modal-backdrop" data-modal-backdrop><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${html}</div></div>`;
  const modal = $modalRoot.querySelector('.modal');
  onMount?.(modal);
  (modal.querySelector('[autofocus]') || modal.querySelector('input, textarea, button'))?.focus();
}
function closeModal() {
  if (!$modalRoot.innerHTML) return;
  $modalRoot.innerHTML = '';
  lastFocus?.focus?.();
}
const modalHead = (title) =>
  `<div class="modal-head"><h2 id="modal-title">${title}</h2><button class="btn btn-ghost btn-icon" data-action="close-modal" aria-label="סגירה">${icon('x')}</button></div>`;

function confirmDialog({ title, text, okText = 'מחיקה', danger = true }) {
  return new Promise((resolve) => {
    openModal(`${modalHead(esc(title))}<p>${text}</p>
      <div class="form-actions">
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok autofocus>${esc(okText)}</button>
        <button class="btn btn-ghost" data-cancel>ביטול</button>
      </div>`, (m) => {
      m.querySelector('[data-ok]').onclick = () => { closeModal(); resolve(true); };
      m.querySelector('[data-cancel]').onclick = () => { closeModal(); resolve(false); };
      m.querySelector('[data-action="close-modal"]').onclick = (e) => { e.stopPropagation(); closeModal(); resolve(false); };
    });
  });
}

function showFormError(form, msg) {
  const box = form.querySelector('.form-error');
  box.textContent = msg;
  box.hidden = false;
  box.scrollIntoView({ block: 'nearest' });
}

// ---------- טופס בת ----------
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\//.test(file.type)) return reject(new Error('יש לבחור קובץ תמונה'));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 320;
      const s = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('לא ניתן לקרוא את התמונה')); };
    img.src = url;
  });
}

function daughterForm(existing) {
  const d = existing || { name: '', birthDate: '', photo: null, color: store.listDaughters().length % 6 };
  let photo = d.photo || null;
  const t = today();
  openModal(`${modalHead(existing ? 'עריכת פרטים' : 'הוספת בת')}
    <form id="d-form" novalidate>
      <div class="form-error" hidden></div>
      <div class="field photo-pick">
        <div id="d-avatar">${avatar({ ...d, photo }, 'avatar-lg')}</div>
        <div class="form-actions">
          <label class="btn btn-soft btn-sm">${icon('camera')}${'בחירת תמונה'}<input type="file" accept="image/*" id="d-photo" class="sr-only"></label>
          <button type="button" class="btn btn-ghost btn-sm" id="d-photo-rm" ${photo ? '' : 'hidden'}>הסרה</button>
        </div>
      </div>
      <div class="field"><label for="d-name">שם הבת</label>
        <input class="input" id="d-name" name="name" required maxlength="40" value="${esc(d.name)}" autofocus></div>
      <div class="field"><label for="d-birth">תאריך לידה <span class="muted small">(אופציונלי)</span></label>
        <input class="input" id="d-birth" name="birthDate" type="date" max="${t}" value="${esc(d.birthDate || '')}"></div>
      <div class="field"><span class="label-like"><strong>צבע הכרטיס</strong></span>
        <div class="colors" role="radiogroup" aria-label="צבע הכרטיס">
          ${[0, 1, 2, 3, 4, 5].map((i) => `<label><input type="radio" name="color" value="${i}" ${i === (d.color ?? 0) ? 'checked' : ''} aria-label="צבע ${i + 1}"><span class="swatch-${i}"></span></label>`).join('')}
        </div></div>
      <div class="form-actions">
        <button class="btn btn-primary grow" type="submit">שמירה</button>
        <button class="btn btn-ghost" type="button" data-action="close-modal">ביטול</button>
        ${existing ? `<button class="btn btn-danger" type="button" id="d-delete">${icon('trash')}מחיקת פרופיל</button>` : ''}
      </div>
    </form>`, (m) => {
    const form = m.querySelector('#d-form');
    const refreshAvatar = () => {
      const color = Number(form.color.value);
      m.querySelector('#d-avatar').innerHTML = avatar({ name: form.name.value || d.name || '?', photo, color }, 'avatar-lg');
      m.querySelector('#d-photo-rm').hidden = !photo;
    };
    form.addEventListener('change', (e) => { if (e.target.name === 'color') refreshAvatar(); });
    form.name.addEventListener('input', refreshAvatar);
    m.querySelector('#d-photo').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try { photo = await resizeImage(file); refreshAvatar(); } catch (err) { showFormError(form, err.message); }
    });
    m.querySelector('#d-photo-rm').onclick = () => { photo = null; refreshAvatar(); };
    m.querySelector('#d-delete')?.addEventListener('click', async () => {
      const n = state.current?.cycles.length ?? 0;
      const ok = await confirmDialog({
        title: 'מחיקת פרופיל',
        text: `למחוק את הפרופיל של <strong>${esc(d.name)}</strong>${n ? ` ואת ${n} המחזורים הרשומים שלה` : ''}? לא ניתן לשחזר את הנתונים.`,
      });
      if (!ok) return;
      try {
        await store.deleteDaughter(d.id);
        toast('הפרופיל נמחק');
        location.hash = '#/';
        if (route().name === 'home') render();
      } catch (err) { toast(err.message, true); }
    });
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const payload = {
        name: form.name.value.trim(), birthDate: form.birthDate.value || null, photo, color: Number(form.color.value),
      };
      if (!payload.name) return showFormError(form, 'יש להזין שם');
      if (payload.birthDate && payload.birthDate > t) return showFormError(form, 'תאריך הלידה לא יכול להיות בעתיד');
      const btn = form.querySelector('[type=submit]');
      btn.disabled = true;
      try {
        if (existing) {
          await store.updateDaughter(d.id, payload, t);
          toast('הפרטים עודכנו');
        } else {
          const nd = await store.addDaughter(payload, t);
          toast(`הפרופיל של ${payload.name} נוצר`);
          closeModal();
          location.hash = `#/d/${nd.id}`;
          return;
        }
        closeModal();
        render();
      } catch (err) {
        showFormError(form, err.message);
        btn.disabled = false;
      }
    });
  });
}

// ---------- טופס מחזור ----------
function cycleForm(existing, presetStart) {
  const { daughter: d, cycles } = state.current;
  const t = today();
  const c = existing || { start: presetStart || t, end: '', notes: '' };
  openModal(`${modalHead(existing ? 'עריכת מחזור' : 'הזנת מחזור חדש')}
    <p class="lead">עבור ${esc(d.name)}</p>
    <form id="c-form" novalidate>
      <div class="form-error" hidden></div>
      <div class="row2">
        <div class="field"><label for="c-start">תאריך התחלה</label>
          <input class="input" id="c-start" name="start" type="date" required max="${t}" value="${esc(c.start)}"></div>
        <div class="field"><label for="c-end">תאריך סיום</label>
          <input class="input" id="c-end" name="end" type="date" max="${t}" value="${esc(c.end || '')}">
          <span class="hint">אפשר להשאיר ריק ולעדכן כשהמחזור מסתיים</span></div>
      </div>
      <p class="small muted" id="c-calc" aria-live="polite"></p>
      <div class="field"><label for="c-notes">הערות <span class="muted small">(אופציונלי)</span></label>
        <textarea class="input" id="c-notes" name="notes" maxlength="1000" placeholder="למשל: כאבים, עוצמה, תרופות…">${esc(c.notes || '')}</textarea></div>
      <div class="form-actions">
        <button class="btn btn-primary grow" type="submit">${existing ? 'שמירת השינויים' : 'שמירה'}</button>
        <button class="btn btn-ghost" type="button" data-action="close-modal">ביטול</button>
      </div>
    </form>`, (m) => {
    const form = m.querySelector('#c-form');
    const calc = m.querySelector('#c-calc');
    const update = () => {
      const s = form.start.value, e = form.end.value;
      form.end.min = s || '';
      if (s && e && e >= s) calc.textContent = `משך הדימום: ${daysWord(diffDays(s, e) + 1)} (כולל יום ההתחלה והסיום)`;
      else calc.textContent = '';
    };
    form.addEventListener('input', update);
    update();
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const payload = { start: form.start.value, end: form.end.value || null, notes: form.notes.value.trim() };
      const errors = validateCycle(payload, cycles, t, existing?.id ?? null);
      if (errors.length) return showFormError(form, errors[0]);
      const btn = form.querySelector('[type=submit]');
      btn.disabled = true;
      try {
        if (existing) await store.updateCycle(d.id, existing.id, payload, t);
        else await store.addCycle(d.id, payload, t);
        closeModal();
        state.calMonth = payload.start.slice(0, 7);
        state.selectedDay = payload.start;
        toast(existing ? 'המחזור עודכן' : 'המחזור נשמר');
        render();
      } catch (err) {
        showFormError(form, err.message);
        btn.disabled = false;
      }
    });
  });
}

// ---------- הגדרות ופרטיות ----------
function settingsForm() {
  const d = data();
  const lockOpts = [[0, 'מיד'], [1, 'אחרי דקה'], [5, 'אחרי 5 דקות'], [15, 'אחרי 15 דקות']];
  openModal(`${modalHead('הגדרות ופרטיות')}
    <form id="s-form" novalidate>
      <div class="field"><label for="s-name">איך לקרוא לך</label>
        <input class="input" id="s-name" name="name" maxlength="40" value="${esc(d.motherName)}" placeholder="למשל: אמא"></div>
      <div class="set-row">
        <div><strong>נעילה בקוד אישי</strong>
          <div class="small muted">${d.pinEnabled ? 'פעילה. הנתונים מוצפנים במכשיר (AES-256).' : 'כבויה. הנתונים שמורים במכשיר בלי הצפנה.'}</div></div>
        <button type="button" class="btn btn-sm ${d.pinEnabled ? 'btn-ghost' : 'btn-primary'}" data-set="${d.pinEnabled ? 'pin-off' : 'pin-on'}">${d.pinEnabled ? 'ביטול' : 'הפעלה'}</button>
      </div>
      ${d.pinEnabled ? `
      <div class="set-row"><strong>החלפת קוד</strong><button type="button" class="btn btn-sm btn-ghost" data-set="pin-change">החלפה</button></div>
      <div class="set-row"><div><strong>נעילה אוטומטית</strong><div class="small muted">כשהאפליקציה עוברת לרקע</div></div>
        <select class="input select-sm" name="autoLockMin" aria-label="נעילה אוטומטית">
          ${lockOpts.map(([v, l]) => `<option value="${v}" ${Number(d.settings.autoLockMin) === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></div>` : ''}
      <div class="set-row"><div><strong>גיבוי</strong><div class="small muted">הנתונים קיימים רק במכשיר הזה. מומלץ לגבות מדי פעם.</div></div>
        <span class="form-actions"><button type="button" class="btn btn-sm btn-soft" data-set="backup">גיבוי</button><button type="button" class="btn btn-sm btn-ghost" data-set="restore">שחזור</button></span></div>
      <div class="form-actions">
        <button class="btn btn-primary grow" type="submit">שמירה</button>
        <button class="btn btn-ghost" type="button" data-action="close-modal">סגירה</button>
      </div>
      <hr class="sep">
      <button type="button" class="btn btn-danger btn-block" data-set="wipe">${icon('trash')}מחיקת כל הנתונים מהמכשיר</button>
    </form>`, (m) => {
    const form = m.querySelector('#s-form');
    form.addEventListener('click', async (ev) => {
      const b = ev.target.closest('[data-set]');
      if (!b) return;
      const act = b.dataset.set;
      if (act === 'pin-on' || act === 'pin-change') return showLock('set');
      if (act === 'pin-off') {
        const ok = await confirmDialog({ title: 'ביטול הנעילה', text: 'הנתונים יישמרו במכשיר בלי הצפנה, וכל מי שפותח את הדפדפן יוכל לראות אותם. להמשיך?', okText: 'ביטול הנעילה' });
        if (!ok) return settingsForm();
        await run(() => store.disablePin(), 'הנעילה בוטלה');
        render();
        return settingsForm();
      }
      if (act === 'backup') return downloadBackup();
      if (act === 'restore') return pickRestore();
      if (act === 'wipe') {
        const ok = await confirmDialog({ title: 'מחיקת כל הנתונים', text: 'כל הפרופילים וכל נתוני המחזור יימחקו מהמכשיר לצמיתות. לא ניתן לשחזר בלי קובץ גיבוי.', okText: 'מחיקת הכל' });
        if (!ok) return settingsForm();
        store.wipe();
        hideLock();
        location.hash = '#/';
        render();
        toast('כל הנתונים נמחקו');
      }
    });
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const patch = { motherName: form.name.value };
      if (form.autoLockMin) patch.autoLockMin = Number(form.autoLockMin.value);
      try { await run(() => store.updateSettings(patch), 'ההגדרות נשמרו'); } catch { return; }
      closeModal();
      render();
    });
  });
}

// ---------- גיבוי ושחזור ----------
async function downloadBackup() {
  try {
    const text = await store.exportBackup();
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-cycle-backup-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(data().pinEnabled ? 'קובץ הגיבוי נשמר (מוצפן בקוד האישי)' : 'קובץ הגיבוי נשמר');
  } catch (e) {
    toast(e.message, true);
  }
}

function askPinDialog() {
  return new Promise((resolve) => {
    openModal(`${modalHead('גיבוי מוצפן')}
      <form id="ap-form" novalidate>
        <div class="field"><label for="ap-pin">הזיני את הקוד שהיה פעיל בזמן הגיבוי</label>
          <input class="input" id="ap-pin" type="password" inputmode="numeric" dir="ltr" autocomplete="off" maxlength="6" autofocus></div>
        <div class="form-actions"><button class="btn btn-primary grow" type="submit" data-ok>פענוח ושחזור</button>
          <button class="btn btn-ghost" type="button" data-cancel>ביטול</button></div>
      </form>`, (m) => {
      m.querySelector('#ap-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const v = m.querySelector('#ap-pin').value;
        closeModal();
        resolve(v);
      });
      m.querySelector('[data-cancel]').onclick = () => { closeModal(); resolve(null); };
      m.querySelector('[data-action="close-modal"]').onclick = (e) => { e.stopPropagation(); closeModal(); resolve(null); };
    });
  });
}

function pickRestore() {
  const input = document.getElementById('restore-file');
  input.value = '';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    const ok = await confirmDialog({
      title: 'שחזור מגיבוי',
      text: 'השחזור יחליף את כל הנתונים שנמצאים כרגע במכשיר בנתונים מקובץ הגיבוי. להמשיך?',
      okText: 'שחזור', danger: false,
    });
    if (!ok) return;
    try {
      const done = await store.importBackup(await file.text(), askPinDialog);
      if (!done) return;
      state.current = null;
      location.hash = '#/';
      render();
      toast('הנתונים שוחזרו');
    } catch (e) {
      toast(e.message, true);
    }
  };
  input.click();
}

// ======================================================================
// אירועים
// ======================================================================
function closeMenu() { state.menuOpen = false; }

async function onAction(action, el) {
  if (action !== 'menu' && state.menuOpen) {
    state.menuOpen = false;
    const pop = document.querySelector('.menu-pop');
    if (pop) pop.hidden = true;
  }
  switch (action) {
    case 'menu': {
      state.menuOpen = !state.menuOpen;
      const pop = document.querySelector('.menu-pop');
      pop.hidden = !state.menuOpen;
      el.setAttribute('aria-expanded', state.menuOpen);
      return;
    }
    case 'home': location.hash = '#/'; return;
    case 'open': location.hash = `#/d/${el.dataset.id}`; return;
    case 'add-daughter': return daughterForm(null);
    case 'edit-daughter': return daughterForm(state.current.daughter);
    case 'new-cycle': return cycleForm(null, el.dataset.day);
    case 'edit-cycle': {
      const c = state.current.cycles.find((x) => String(x.id) === el.dataset.id);
      return c && cycleForm(c);
    }
    case 'delete-cycle': {
      const a = analyze(state.current.cycles, today());
      const c = a.rows.find((x) => String(x.id) === el.dataset.id);
      if (!c) return;
      const ok = await confirmDialog({
        title: 'מחיקת מחזור',
        text: `למחוק את מחזור מס׳ ${c.number} (${formatDate(c.start)})? החישובים יתעדכנו בהתאם.`,
      });
      if (!ok) return;
      try {
        await store.deleteCycle(state.current.daughter.id, c.id);
        toast('המחזור נמחק');
        render();
      } catch (e) { toast(e.message, true); }
      return;
    }
    case 'sort': state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc'; return renderDaughter();
    case 'cal-prev':
    case 'cal-next': {
      const [y, m] = state.calMonth.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1 + (action === 'cal-next' ? 1 : -1), 1));
      state.calMonth = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
      return refreshCalendar();
    }
    case 'day':
      state.selectedDay = state.selectedDay === el.dataset.day ? null : el.dataset.day;
      if (!el.dataset.day.startsWith(state.calMonth)) state.calMonth = el.dataset.day.slice(0, 7);
      refreshCalendar();
      document.querySelector(`[data-day="${state.selectedDay}"]`)?.focus();
      return;
    case 'close-modal': return closeModal();
    case 'lock-now': return lockNow();
    case 'settings': return settingsForm();
    case 'backup': return downloadBackup();
    case 'restore': return pickRestore();
    case 'demo-load':
      try { await store.loadDemo(today()); toast('נתוני ההדגמה נטענו'); location.hash = '#/'; render(); } catch (e) { toast(e.message, true); }
      return;
    case 'demo-delete': {
      const ok = await confirmDialog({ title: 'מחיקת נתוני הדגמה', text: 'למחוק את כל פרופילי ההדגמה ונתוניהם? הנתונים שהזנת בעצמך לא יימחקו.' });
      if (!ok) return;
      try {
        await store.deleteDemo();
        toast('נתוני ההדגמה נמחקו');
        if (state.current?.daughter.isDemo) location.hash = '#/';
        render();
      } catch (e) { toast(e.message, true); }
      return;
    }
  }
}

function refreshCalendar() {
  const a = analyze(state.current.cycles, today());
  document.getElementById('calendar').innerHTML = calendarHTML(a);
}

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (ev.target.matches('[data-modal-backdrop]')) {
    const cancel = $modalRoot.querySelector('[data-cancel]');
    return cancel ? cancel.click() : closeModal();
  }
  if (state.menuOpen && !ev.target.closest('.menu')) {
    state.menuOpen = false;
    const pop = document.querySelector('.menu-pop');
    if (pop) pop.hidden = true;
  }
  if (el) {
    ev.preventDefault();
    onAction(el.dataset.action, el);
  }
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') {
    if ($modalRoot.innerHTML) {
      const cancel = $modalRoot.querySelector('[data-cancel]');
      return cancel ? cancel.click() : closeModal();
    }
    if (state.menuOpen) { state.menuOpen = false; document.querySelector('.menu-pop').hidden = true; }
  }
  // שמירת הפוקוס בתוך החלון הקופץ
  if (ev.key === 'Tab' && $modalRoot.innerHTML) {
    const f = [...$modalRoot.querySelectorAll('button, input, textarea, select, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  }
});

window.addEventListener('hashchange', () => { closeModal(); render(); window.scrollTo(0, 0); });

// ======================================================================
// הפעלה
// ======================================================================
store.init();
render();

// עבודה גם בלי חיבור לרשת, והתקנה במסך הבית
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => { /* לא חובה */ });
}
