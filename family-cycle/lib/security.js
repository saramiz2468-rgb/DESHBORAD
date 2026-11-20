// הצפנה, גיבוב סיסמאות ואסימוני התחברות.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/** טוען מפתח הצפנה ראשי מ-APP_SECRET או מקובץ שנוצר פעם אחת בתיקיית הנתונים */
export function loadMasterKey(dataDir) {
  const fromEnv = process.env.APP_SECRET;
  let raw;
  if (fromEnv) {
    raw = fromEnv;
  } else {
    const file = path.join(dataDir, 'secret.key');
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
    }
    raw = fs.readFileSync(file, 'utf8').trim();
  }
  if (raw.length < 32) throw new Error('APP_SECRET must be at least 32 characters');
  // גוזרים מפתחות נפרדים להצפנה ולגיבוב אסימונים
  const ikm = Buffer.from(raw, 'utf8');
  const enc = Buffer.from(crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), 'family-cycle:data-encryption', 32));
  const mac = Buffer.from(crypto.hkdfSync('sha256', ikm, Buffer.alloc(0), 'family-cycle:token-mac', 32));
  return { enc, mac };
}

/**
 * הצפנת אובייקט JSON ב-AES-256-GCM.
 * aad קושר את הרשומה לבעליה (משתמשת/בת), כך שאי אפשר להעביר רשומה מוצפנת בין פרופילים.
 */
export function encryptJSON(key, obj, aad) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ct = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return 'v1.' + Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decryptJSON(key, blob, aad) {
  if (typeof blob !== 'string' || !blob.startsWith('v1.')) throw new Error('bad ciphertext');
  const buf = Buffer.from(blob.slice(3), 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8'));
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: +N, r: +r, p: +p,
  });
  return crypto.timingSafeEqual(expected, actual);
}

/** גיבוב סיסמה מדומה, כדי שזמן התגובה לא יחשוף אם האימייל קיים */
export const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'));

export function newToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function tokenId(macKey, token) {
  return crypto.createHmac('sha256', macKey).update(token).digest('hex');
}
