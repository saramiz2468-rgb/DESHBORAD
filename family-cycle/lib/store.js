// שכבת הנתונים: SQLite מובנה ב-Node, עם הצפנת שדות רגישים.
// כל שאילתה מסוננת לפי user_id, וכל מחזור גם לפי daughter_id.
import { DatabaseSync } from 'node:sqlite';
import { encryptJSON, decryptJSON } from './security.js';

export function openStore(file, keys) {
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      pass_hash TEXT NOT NULL,
      profile TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS daughters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      daughter_id INTEGER NOT NULL REFERENCES daughters(id) ON DELETE CASCADE,
      data TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_daughters_user ON daughters(user_id);
    CREATE INDEX IF NOT EXISTS idx_cycles_owner ON cycles(user_id, daughter_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);

  const K = keys.enc;
  const aadUser = (id) => `user:${id}`;
  const aadDaughter = (userId) => `daughter:${userId}`;
  const aadCycle = (userId, daughterId) => `cycle:${userId}:${daughterId}`;

  const q = {
    userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    userById: db.prepare('SELECT * FROM users WHERE id = ?'),
    insertUser: db.prepare('INSERT INTO users (email, pass_hash, profile) VALUES (?, ?, ?)'),
    deleteUser: db.prepare('DELETE FROM users WHERE id = ?'),
    insertSession: db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'),
    sessionById: db.prepare('SELECT * FROM sessions WHERE id = ?'),
    touchSession: db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?'),
    deleteSession: db.prepare('DELETE FROM sessions WHERE id = ?'),
    purgeSessions: db.prepare('DELETE FROM sessions WHERE expires_at < ?'),
    daughters: db.prepare('SELECT * FROM daughters WHERE user_id = ? ORDER BY id'),
    daughter: db.prepare('SELECT * FROM daughters WHERE id = ? AND user_id = ?'),
    insertDaughter: db.prepare('INSERT INTO daughters (user_id, data, is_demo) VALUES (?, ?, ?)'),
    updateDaughter: db.prepare('UPDATE daughters SET data = ? WHERE id = ? AND user_id = ?'),
    deleteDaughter: db.prepare('DELETE FROM daughters WHERE id = ? AND user_id = ?'),
    cycles: db.prepare('SELECT * FROM cycles WHERE user_id = ? AND daughter_id = ? ORDER BY id'),
    cycle: db.prepare('SELECT * FROM cycles WHERE id = ? AND user_id = ?'),
    insertCycle: db.prepare('INSERT INTO cycles (user_id, daughter_id, data, is_demo) VALUES (?, ?, ?, ?)'),
    updateCycle: db.prepare(
      "UPDATE cycles SET data = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ? AND daughter_id = ?"
    ),
    deleteCycle: db.prepare('DELETE FROM cycles WHERE id = ? AND user_id = ? AND daughter_id = ?'),
    deleteDemo: db.prepare('DELETE FROM daughters WHERE user_id = ? AND is_demo = 1'),
    deleteDemoCycles: db.prepare('DELETE FROM cycles WHERE user_id = ? AND is_demo = 1'),
    countDemo: db.prepare('SELECT COUNT(*) AS n FROM daughters WHERE user_id = ? AND is_demo = 1'),
  };

  function tx(fn) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const out = fn();
      db.exec('COMMIT');
      return out;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }

  function userOut(row) {
    if (!row) return null;
    const profile = decryptJSON(K, row.profile, aadUser(row.id));
    return { id: row.id, email: row.email, name: profile.name, passHash: row.pass_hash };
  }

  function daughterOut(row) {
    const d = decryptJSON(K, row.data, aadDaughter(row.user_id, row.id));
    return {
      id: row.id,
      name: d.name,
      birthDate: d.birthDate || null,
      photo: d.photo || null,
      color: d.color ?? 0,
      isDemo: !!row.is_demo,
    };
  }

  function cycleOut(row) {
    const c = decryptJSON(K, row.data, aadCycle(row.user_id, row.daughter_id));
    return {
      id: row.id,
      daughterId: row.daughter_id,
      start: c.start,
      end: c.end || null,
      notes: c.notes || '',
      isDemo: !!row.is_demo,
      updatedAt: row.updated_at,
    };
  }

  return {
    db,
    tx,

    // ---- משתמשות ----
    findUserByEmail: (email) => userOut(q.userByEmail.get(email)),
    getUser: (id) => userOut(q.userById.get(id)),
    createUser(email, passHash, name) {
      return tx(() => {
        // הפרופיל מוצפן עם מזהה המשתמשת, לכן מכניסים זמנית ומעדכנים
        const r = q.insertUser.run(email, passHash, 'pending');
        const id = Number(r.lastInsertRowid);
        db.prepare('UPDATE users SET profile = ? WHERE id = ?').run(encryptJSON(K, { name }, aadUser(id)), id);
        return id;
      });
    },
    deleteUser: (id) => q.deleteUser.run(id),

    // ---- התחברות ----
    createSession: (id, userId, expiresAt) => q.insertSession.run(id, userId, expiresAt),
    getSession: (id) => q.sessionById.get(id),
    touchSession: (id, expiresAt) => q.touchSession.run(expiresAt, id),
    deleteSession: (id) => q.deleteSession.run(id),
    purgeSessions: () => q.purgeSessions.run(Date.now()),

    // ---- בנות ----
    listDaughters: (userId) => q.daughters.all(userId).map(daughterOut),
    getDaughter(userId, id) {
      const row = q.daughter.get(id, userId);
      return row ? daughterOut(row) : null;
    },
    createDaughter(userId, data, isDemo = false) {
      const r = q.insertDaughter.run(userId, encryptJSON(K, data, aadDaughter(userId)), isDemo ? 1 : 0);
      return Number(r.lastInsertRowid);
    },
    updateDaughter(userId, id, data) {
      return q.updateDaughter.run(encryptJSON(K, data, aadDaughter(userId)), id, userId).changes > 0;
    },
    deleteDaughter: (userId, id) => q.deleteDaughter.run(id, userId).changes > 0,

    // ---- מחזורים ----
    listCycles: (userId, daughterId) => q.cycles.all(userId, daughterId).map(cycleOut),
    getCycle(userId, id) {
      const row = q.cycle.get(id, userId);
      return row ? cycleOut(row) : null;
    },
    createCycle(userId, daughterId, data, isDemo = false) {
      const blob = encryptJSON(K, data, aadCycle(userId, daughterId));
      return Number(q.insertCycle.run(userId, daughterId, blob, isDemo ? 1 : 0).lastInsertRowid);
    },
    updateCycle(userId, daughterId, id, data) {
      const blob = encryptJSON(K, data, aadCycle(userId, daughterId));
      return q.updateCycle.run(blob, id, userId, daughterId).changes > 0;
    },
    deleteCycle: (userId, daughterId, id) => q.deleteCycle.run(id, userId, daughterId).changes > 0,

    // ---- נתוני הדגמה ----
    hasDemo: (userId) => q.countDemo.get(userId).n > 0,
    deleteDemo(userId) {
      return tx(() => {
        q.deleteDemoCycles.run(userId);
        return q.deleteDemo.run(userId).changes;
      });
    },
  };
}
