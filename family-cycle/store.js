// שכבת השמירה: כל הנתונים נשמרים רק במכשיר (localStorage).
// כשנעילה בקוד פעילה, הנתונים מוצפנים ב-AES-256-GCM עם מפתח שנגזר מהקוד (PBKDF2).
import { validateCycle, isValidDate, sortByStart } from './calc.js';

export const KEY_PLAIN = 'family-cycle:data';
export const KEY_ENC = 'family-cycle:enc';
const PBKDF2_ITER = 250000;
const MAX_PHOTO = 400 * 1024;

export class StoreError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}

const b64 = {
  enc: (buf) => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(s);
  },
  dec: (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
};

const cleanText = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

function blankState() {
  return {
    app: 'family-cycle',
    v: 1,
    created: new Date().toISOString(),
    onboarded: false,
    motherName: '',
    pinEnabled: false,
    settings: { autoLockMin: 1 },
    nextId: 1,
    daughters: [],
  };
}

function normalize(s) {
  const out = Object.assign(blankState(), s && typeof s === 'object' ? s : {});
  out.settings = Object.assign({ autoLockMin: 1 }, out.settings || {});
  out.daughters = Array.isArray(out.daughters) ? out.daughters : [];
  let maxId = 0;
  for (const d of out.daughters) {
    d.cycles = Array.isArray(d.cycles) ? d.cycles.filter((c) => isValidDate(c.start)) : [];
    maxId = Math.max(maxId, Number(d.id) || 0, ...d.cycles.map((c) => Number(c.id) || 0));
  }
  out.nextId = Math.max(Number(out.nextId) || 1, maxId + 1);
  return out;
}

function deviceStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

export function createStore({ storage = deviceStorage(), subtle = globalThis.crypto?.subtle } = {}) {
  let state = null;
  let key = null;
  let salt = null;
  let pinLen = null; // אורך הקוד בלבד (4–6), כדי לבדוק אותו ברגע שהוקלד במלואו

  const ls = {
    get(k) { try { return storage.getItem(k); } catch { return null; } },
    set(k, v) {
      try { if (!storage) throw new Error('no storage'); storage.setItem(k, v); } catch {
        throw new StoreError('השמירה נכשלה. ייתכן שהאחסון במכשיר מלא או חסום (למשל בגלישה פרטית).');
      }
    },
    del(k) { try { storage.removeItem(k); } catch { /* מתעלמים */ } },
  };

  async function deriveKey(pin, saltBytes) {
    const base = await subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
    return subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITER, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  }

  async function encrypt(obj, k, saltBytes) {
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(JSON.stringify(obj)));
    return { salt: b64.enc(saltBytes), iv: b64.enc(iv), ct: b64.enc(ct) };
  }

  async function decrypt(blob, pin) {
    const s = b64.dec(blob.salt);
    const k = await deriveKey(pin, s);
    const pt = await subtle.decrypt({ name: 'AES-GCM', iv: b64.dec(blob.iv) }, k, b64.dec(blob.ct));
    return { data: JSON.parse(new TextDecoder().decode(pt)), key: k, salt: s };
  }

  async function persist() {
    if (state.pinEnabled && key) {
      ls.set(KEY_ENC, JSON.stringify({ ...(await encrypt(state, key, salt)), len: pinLen }));
      ls.del(KEY_PLAIN);
    } else {
      ls.set(KEY_PLAIN, JSON.stringify(state));
      ls.del(KEY_ENC);
    }
  }

  /** מריץ שינוי ושומר. אם השמירה נכשלת, המצב חוזר לקדמותו. */
  async function mutate(fn) {
    const snapshot = JSON.stringify(state);
    try {
      const out = fn(state);
      await persist();
      return out;
    } catch (e) {
      state = JSON.parse(snapshot);
      throw e;
    }
  }

  function requireState() {
    if (!state) throw new StoreError('האפליקציה נעולה');
    return state;
  }

  function findDaughter(id) {
    const d = requireState().daughters.find((x) => x.id === Number(id));
    if (!d) throw new StoreError('הפרופיל לא נמצא');
    return d;
  }

  function parseDaughter(input, today) {
    const name = cleanText(input.name, 40);
    if (!name) throw new StoreError('יש להזין שם');
    const birthDate = input.birthDate || null;
    if (birthDate && (!isValidDate(birthDate) || (today && birthDate > today)))
      throw new StoreError('תאריך הלידה אינו תקין');
    const photo = input.photo || null;
    if (photo) {
      if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(photo))
        throw new StoreError('פורמט התמונה אינו נתמך');
      if (photo.length > MAX_PHOTO) throw new StoreError('התמונה גדולה מדי');
    }
    const color = Number.isInteger(input.color) && input.color >= 0 && input.color < 6 ? input.color : 0;
    return { name, birthDate, photo, color };
  }

  function parseCycle(input) {
    return { start: input.start, end: input.end || null, notes: cleanText(input.notes, 1000) };
  }

  const pub = (d) => (d ? JSON.parse(JSON.stringify(d)) : null);

  return {
    /** 'new' – אין נתונים, 'locked' – יש נתונים מוצפנים, 'ready' – נטען */
    init() {
      if (ls.get(KEY_ENC)) return 'locked';
      const raw = ls.get(KEY_PLAIN);
      if (raw) {
        try { state = normalize(JSON.parse(raw)); } catch { state = blankState(); }
      } else {
        state = blankState();
      }
      return state.onboarded ? 'ready' : 'new';
    },

    async unlock(pin) {
      const raw = ls.get(KEY_ENC);
      if (!raw) return false;
      try {
        const r = await decrypt(JSON.parse(raw), pin);
        state = normalize(r.data);
        key = r.key;
        salt = r.salt;
        pinLen = pin.length;
        return true;
      } catch {
        return false;
      }
    },

    lock() {
      if (!state?.pinEnabled) return false;
      state = null;
      key = null;
      salt = null;
      return true;
    },

    isLocked: () => !state,

    /** אורך הקוד השמור (או null אם לא ידוע) */
    pinLength() {
      try { return JSON.parse(ls.get(KEY_ENC))?.len || null; } catch { return null; }
    },
    get: () => pub(requireState()),

    async setPin(pin) {
      if (!/^\d{4,6}$/.test(pin)) throw new StoreError('הקוד צריך לכלול 4–6 ספרות');
      requireState();
      salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
      key = await deriveKey(pin, salt);
      pinLen = pin.length;
      await mutate((s) => { s.pinEnabled = true; });
    },

    async disablePin() {
      requireState();
      await mutate((s) => { s.pinEnabled = false; });
      key = null;
      salt = null;
    },

    async completeOnboarding({ motherName }) {
      await mutate((s) => {
        s.motherName = cleanText(motherName, 40);
        s.onboarded = true;
      });
    },

    async updateSettings(patch) {
      await mutate((s) => {
        if (patch.motherName !== undefined) s.motherName = cleanText(patch.motherName, 40);
        if (patch.autoLockMin !== undefined) s.settings.autoLockMin = Math.max(0, Math.min(60, Number(patch.autoLockMin) || 0));
      });
    },

    // ---- בנות ----
    listDaughters: () => pub(requireState().daughters),
    getDaughter: (id) => pub(findDaughter(id)),

    async addDaughter(input, today) {
      const data = parseDaughter(input, today);
      return mutate((s) => {
        const d = { id: s.nextId++, ...data, isDemo: false, createdAt: new Date().toISOString(), cycles: [] };
        s.daughters.push(d);
        return pub(d);
      });
    },

    async updateDaughter(id, input, today) {
      const cur = findDaughter(id);
      const data = parseDaughter({ ...cur, ...input }, today);
      return mutate(() => pub(Object.assign(findDaughter(id), data)));
    },

    async deleteDaughter(id) {
      findDaughter(id);
      await mutate((s) => { s.daughters = s.daughters.filter((d) => d.id !== Number(id)); });
    },

    // ---- מחזורים: כל בת והמחזורים שלה בלבד ----
    async addCycle(daughterId, input, today) {
      const d = findDaughter(daughterId);
      const data = parseCycle(input);
      const errors = validateCycle(data, d.cycles, today, null);
      if (errors.length) throw new StoreError(errors[0], errors);
      return mutate((s) => {
        const c = { id: s.nextId++, ...data, isDemo: false, updatedAt: new Date().toISOString() };
        const target = findDaughter(daughterId);
        target.cycles = sortByStart([...target.cycles, c]);
        return pub(c);
      });
    },

    async updateCycle(daughterId, cycleId, input, today) {
      const d = findDaughter(daughterId);
      const cur = d.cycles.find((c) => c.id === Number(cycleId));
      if (!cur) throw new StoreError('הרשומה לא נמצאה');
      const data = parseCycle({ ...cur, ...input });
      const errors = validateCycle(data, d.cycles, today, cur.id);
      if (errors.length) throw new StoreError(errors[0], errors);
      return mutate(() => {
        const target = findDaughter(daughterId);
        const c = target.cycles.find((x) => x.id === Number(cycleId));
        Object.assign(c, data, { updatedAt: new Date().toISOString() });
        target.cycles = sortByStart(target.cycles);
        return pub(c);
      });
    },

    async deleteCycle(daughterId, cycleId) {
      const d = findDaughter(daughterId);
      if (!d.cycles.some((c) => c.id === Number(cycleId))) throw new StoreError('הרשומה לא נמצאה');
      await mutate(() => {
        const target = findDaughter(daughterId);
        target.cycles = target.cycles.filter((c) => c.id !== Number(cycleId));
      });
    },

    // ---- פרופילי הדגמה שנשארו מגרסה קודמת (למשל משחזור גיבוי ישן) ----
    hasDemo: () => !!state && state.daughters.some((d) => d.isDemo),

    async deleteDemo() {
      let removed = 0;
      await mutate((s) => {
        removed = s.daughters.filter((d) => d.isDemo).length;
        s.daughters = s.daughters.filter((d) => !d.isDemo);
      });
      return removed;
    },

    // ---- גיבוי ושחזור ----
    async exportBackup() {
      const s = requireState();
      if (s.pinEnabled && key) {
        return JSON.stringify({ app: 'family-cycle', encrypted: true, data: await encrypt(s, key, salt) });
      }
      return JSON.stringify({ app: 'family-cycle', encrypted: false, data: s }, null, 1);
    },

    /** askPin: פונקציה שמחזירה את הקוד שהיה פעיל בזמן הגיבוי (לקובץ מוצפן) */
    async importBackup(text, askPin) {
      requireState();
      let obj;
      try { obj = JSON.parse(text); } catch { throw new StoreError('הקובץ אינו קובץ גיבוי תקין'); }
      if (!obj || obj.app !== 'family-cycle' || !obj.data) throw new StoreError('הקובץ אינו קובץ גיבוי של האפליקציה');
      let data = obj.data;
      if (obj.encrypted) {
        const pin = await askPin();
        if (!pin) return false;
        try { data = (await decrypt(obj.data, pin)).data; } catch { throw new StoreError('הקוד שגוי, לא ניתן לפענח את הגיבוי'); }
      }
      const keepPin = state.pinEnabled && !!key;
      await mutate(() => {
        state = normalize(data);
        state.pinEnabled = keepPin;
        state.onboarded = true;
      });
      return true;
    },

    wipe() {
      ls.del(KEY_ENC);
      ls.del(KEY_PLAIN);
      state = blankState();
      key = null;
      salt = null;
    },
  };
}
