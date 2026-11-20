// שרת "המעקב המשפחתי שלי" – Node בלבד, בלי תלויות חיצוניות.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore } from './lib/store.js';
import {
  loadMasterKey, hashPassword, verifyPassword, DUMMY_HASH, newToken, tokenId,
} from './lib/security.js';
import { loadDemo } from './lib/demo.js';
import { validateCycle, isValidDate, fromDay } from './public/calc.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;
const COOKIE = 'fc_session';
const MAX_BODY = 1024 * 1024;
const MAX_PHOTO = 400 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
};

const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; " +
    "object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** היום לפי השעון של השרת (UTC). בדיקות התאריך מאפשרות יום סבילות לאזורי זמן. */
const serverToday = () => fromDay(Math.floor(Date.now() / 86400000));

export function createApp({ dataDir = path.join(ROOT, 'data'), secureCookies = false } = {}) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const keys = loadMasterKey(dataDir);
  const store = openStore(path.join(dataDir, 'family-cycle.db'), keys);
  const loginAttempts = new Map(); // הגבלת ניסיונות התחברות לפי IP ואימייל

  // ---------- כלים ----------
  function send(res, status, body, headers = {}) {
    const isJson = typeof body !== 'string' && !Buffer.isBuffer(body);
    res.writeHead(status, {
      ...SECURITY_HEADERS,
      ...(isJson ? { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } : {}),
      ...headers,
    });
    res.end(isJson ? JSON.stringify(body) : body);
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY) {
          reject(new HttpError(413, 'הבקשה גדולה מדי'));
          req.destroy();
        } else chunks.push(c);
      });
      req.on('end', () => {
        if (!chunks.length) return resolve({});
        try {
          const v = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          resolve(v && typeof v === 'object' && !Array.isArray(v) ? v : {});
        } catch {
          reject(new HttpError(400, 'נתונים לא תקינים'));
        }
      });
      req.on('error', reject);
    });
  }

  function parseCookies(req) {
    const out = {};
    for (const part of (req.headers.cookie || '').split(';')) {
      const i = part.indexOf('=');
      if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    }
    return out;
  }

  function sessionCookie(token, maxAgeSec) {
    return [
      `${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeSec}`,
      ...(secureCookies ? ['Secure'] : []),
    ].join('; ');
  }

  function currentUser(req) {
    const token = parseCookies(req)[COOKIE];
    if (!token || token.length > 100) return null;
    const id = tokenId(keys.mac, token);
    const s = store.getSession(id);
    if (!s) return null;
    if (s.expires_at < Date.now()) {
      store.deleteSession(id);
      return null;
    }
    // חלון מתגלגל: חידוש תוקף כשהמשתמשת פעילה
    if (s.expires_at - Date.now() < SESSION_TTL_MS / 2) store.touchSession(id, Date.now() + SESSION_TTL_MS);
    const user = store.getUser(s.user_id);
    return user ? { ...user, sessionId: id } : null;
  }

  function startSession(res, userId) {
    const token = newToken();
    store.createSession(tokenId(keys.mac, token), userId, Date.now() + SESSION_TTL_MS);
    return sessionCookie(token, SESSION_TTL_MS / 1000);
  }

  function clientIp(req) {
    return req.socket.remoteAddress || 'unknown';
  }

  function checkRate(key) {
    const now = Date.now();
    const rec = loginAttempts.get(key);
    if (rec && rec.until > now) {
      const min = Math.ceil((rec.until - now) / 60000);
      throw new HttpError(429, `יותר מדי ניסיונות. אפשר לנסות שוב בעוד ${min} דקות.`);
    }
  }

  function recordFailure(key) {
    const now = Date.now();
    const rec = loginAttempts.get(key) || { count: 0, first: now, until: 0 };
    if (now - rec.first > 15 * 60000) Object.assign(rec, { count: 0, first: now });
    rec.count++;
    if (rec.count >= 8) rec.until = now + 15 * 60000;
    loginAttempts.set(key, rec);
  }

  const cleanText = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
  const normEmail = (v) => String(v ?? '').trim().toLowerCase();

  function parseDaughter(body) {
    const name = cleanText(body.name, 40);
    if (!name) throw new HttpError(400, 'יש להזין שם');
    let birthDate = body.birthDate || null;
    if (birthDate) {
      if (!isValidDate(birthDate) || birthDate > serverToday()) throw new HttpError(400, 'תאריך הלידה אינו תקין');
    }
    let photo = body.photo || null;
    if (photo) {
      if (typeof photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo))
        throw new HttpError(400, 'פורמט התמונה אינו נתמך');
      if (photo.length > MAX_PHOTO) throw new HttpError(400, 'התמונה גדולה מדי');
    }
    const color = Number.isInteger(body.color) && body.color >= 0 && body.color < 6 ? body.color : 0;
    return { name, birthDate, photo, color };
  }

  function parseCycle(body) {
    return {
      start: body.start,
      end: body.end || null,
      notes: cleanText(body.notes, 1000),
    };
  }

  function requireDaughter(user, id) {
    const d = store.getDaughter(user.id, Number(id));
    if (!d) throw new HttpError(404, 'הפרופיל לא נמצא');
    return d;
  }

  function cycleErrors(user, daughterId, data, editingId) {
    const existing = store.listCycles(user.id, daughterId);
    const errors = validateCycle(data, existing, serverToday(), editingId);
    if (errors.length) throw new HttpError(422, errors[0], errors);
  }

  // ---------- נתיבי API ----------
  const routes = [];
  const route = (method, pattern, handler, { auth = true } = {}) => {
    const keys = [];
    const re = new RegExp(
      '^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '(\\d+)')) + '$'
    );
    routes.push({ method, re, keys, handler, auth });
  };

  route('POST', '/api/auth/register', async (req, res, { body }) => {
    const ipKey = 'reg:' + clientIp(req);
    checkRate(ipKey);
    const name = cleanText(body.name, 40);
    const email = normEmail(body.email);
    const password = String(body.password ?? '');
    if (!name) throw new HttpError(400, 'יש להזין שם');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw new HttpError(400, 'כתובת האימייל אינה תקינה');
    if (password.length < 8) throw new HttpError(400, 'הסיסמה צריכה להכיל לפחות 8 תווים');
    if (password.length > 200) throw new HttpError(400, 'הסיסמה ארוכה מדי');
    if (store.findUserByEmail(email)) {
      recordFailure(ipKey);
      throw new HttpError(409, 'כבר קיים חשבון עם האימייל הזה');
    }
    const userId = store.createUser(email, hashPassword(password), name);
    if (body.demo) loadDemo(store, userId, serverToday());
    const cookie = startSession(res, userId);
    send(res, 201, { user: { name, email } }, { 'Set-Cookie': cookie });
  }, { auth: false });

  route('POST', '/api/auth/login', async (req, res, { body }) => {
    const email = normEmail(body.email);
    const password = String(body.password ?? '').slice(0, 200);
    const key = `login:${clientIp(req)}:${email}`;
    checkRate(key);
    const user = store.findUserByEmail(email);
    const ok = verifyPassword(password, user ? user.passHash : DUMMY_HASH);
    if (!user || !ok) {
      recordFailure(key);
      throw new HttpError(401, 'האימייל או הסיסמה שגויים');
    }
    loginAttempts.delete(key);
    store.purgeSessions();
    const cookie = startSession(res, user.id);
    send(res, 200, { user: { name: user.name, email: user.email } }, { 'Set-Cookie': cookie });
  }, { auth: false });

  route('POST', '/api/auth/logout', async (req, res, { user }) => {
    store.deleteSession(user.sessionId);
    send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  });

  // בדיקת מצב התחברות בטעינת הדף: מחזיר user=null במקום שגיאה
  route('GET', '/api/me', async (req, res, { user }) => {
    if (!user) return send(res, 200, { user: null });
    send(res, 200, { user: { name: user.name, email: user.email }, hasDemo: store.hasDemo(user.id) });
  }, { auth: false });

  route('DELETE', '/api/me', async (req, res, { user, body }) => {
    if (!verifyPassword(String(body.password ?? ''), user.passHash)) throw new HttpError(403, 'הסיסמה שגויה');
    store.deleteUser(user.id);
    send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  });

  // רשימת הבנות לכרטיסים: רק תאריכים, בלי הערות
  route('GET', '/api/daughters', async (req, res, { user }) => {
    const daughters = store.listDaughters(user.id).map((d) => ({
      ...d,
      cycles: store.listCycles(user.id, d.id).map(({ id, start, end }) => ({ id, start, end })),
    }));
    send(res, 200, { daughters, hasDemo: store.hasDemo(user.id) });
  });

  route('POST', '/api/daughters', async (req, res, { user, body }) => {
    const id = store.createDaughter(user.id, parseDaughter(body));
    send(res, 201, { daughter: store.getDaughter(user.id, id) });
  });

  route('GET', '/api/daughters/:id', async (req, res, { user, params }) => {
    const d = requireDaughter(user, params.id);
    send(res, 200, { daughter: d, cycles: store.listCycles(user.id, d.id) });
  });

  route('PUT', '/api/daughters/:id', async (req, res, { user, params, body }) => {
    const d = requireDaughter(user, params.id);
    const data = parseDaughter({ ...d, ...body });
    store.updateDaughter(user.id, d.id, data);
    send(res, 200, { daughter: store.getDaughter(user.id, d.id) });
  });

  route('DELETE', '/api/daughters/:id', async (req, res, { user, params }) => {
    const d = requireDaughter(user, params.id);
    store.deleteDaughter(user.id, d.id);
    send(res, 200, { ok: true });
  });

  route('POST', '/api/daughters/:id/cycles', async (req, res, { user, params, body }) => {
    const d = requireDaughter(user, params.id);
    const data = parseCycle(body);
    const id = store.tx(() => {
      cycleErrors(user, d.id, data, null);
      return store.createCycle(user.id, d.id, data);
    });
    send(res, 201, { cycle: store.getCycle(user.id, id) });
  });

  route('PUT', '/api/daughters/:id/cycles/:cid', async (req, res, { user, params, body }) => {
    const d = requireDaughter(user, params.id);
    const existing = store.getCycle(user.id, Number(params.cid));
    if (!existing || existing.daughterId !== d.id) throw new HttpError(404, 'הרשומה לא נמצאה');
    const data = parseCycle({ ...existing, ...body });
    store.tx(() => {
      cycleErrors(user, d.id, data, existing.id);
      store.updateCycle(user.id, d.id, existing.id, data);
    });
    send(res, 200, { cycle: store.getCycle(user.id, existing.id) });
  });

  route('DELETE', '/api/daughters/:id/cycles/:cid', async (req, res, { user, params }) => {
    const d = requireDaughter(user, params.id);
    if (!store.deleteCycle(user.id, d.id, Number(params.cid))) throw new HttpError(404, 'הרשומה לא נמצאה');
    send(res, 200, { ok: true });
  });

  route('POST', '/api/demo', async (req, res, { user }) => {
    if (store.hasDemo(user.id)) throw new HttpError(409, 'נתוני ההדגמה כבר טעונים');
    loadDemo(store, user.id, serverToday());
    send(res, 201, { ok: true });
  });

  route('DELETE', '/api/demo', async (req, res, { user }) => {
    send(res, 200, { removed: store.deleteDemo(user.id) });
  });

  // ---------- קבצים סטטיים ----------
  function serveStatic(req, res, pathname) {
    let rel = decodeURIComponent(pathname);
    if (rel === '/' || !path.extname(rel)) rel = '/index.html';
    const file = path.normalize(path.join(PUBLIC, rel));
    if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain' });
    fs.readFile(file, (err, buf) => {
      if (err) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
      send(res, 200, buf, {
        'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
    });
  }

  // ---------- מטפל ראשי ----------
  async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const { pathname } = url;
    try {
      if (!pathname.startsWith('/api/')) {
        if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed');
        return serveStatic(req, res, pathname);
      }
      // הגנת CSRF: בקשות משנות חייבות כותרת מותאמת ו-Origin תואם
      if (req.method !== 'GET') {
        if (req.headers['x-requested-with'] !== 'fetch') throw new HttpError(403, 'בקשה לא מורשית');
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host) throw new HttpError(403, 'בקשה לא מורשית');
      }
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = r.re.exec(pathname);
        if (!m) continue;
        const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
        const user = currentUser(req);
        if (r.auth && !user) throw new HttpError(401, 'יש להתחבר מחדש');
        const body = req.method === 'GET' ? {} : await readBody(req);
        return await r.handler(req, res, { user, params, body });
      }
      throw new HttpError(404, 'לא נמצא');
    } catch (err) {
      if (!(err instanceof HttpError)) console.error(err);
      const status = err instanceof HttpError ? err.status : 500;
      if (!res.headersSent) {
        send(res, status, { error: status === 500 ? 'שגיאה בשרת, נסי שוב' : err.message, details: err.details });
      }
    }
  }

  return { handler, store };
}

// הפעלה ישירה: node server.js
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '127.0.0.1';
  const { handler } = createApp({
    dataDir: process.env.DATA_DIR || path.join(ROOT, 'data'),
    secureCookies: process.env.SECURE_COOKIES === '1',
  });
  http.createServer(handler).listen(port, host, () => {
    console.log(`המעקב המשפחתי שלי פועל בכתובת http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
  });
}
