#!/usr/bin/env node
/**
 * Guarantees that the original prototype and the other projects in the parent
 * repository are byte-for-byte unchanged. Compares SHA-256 hashes of every file
 * against scripts/protected-files.lock.json.
 *
 *   node scripts/verify-prototype.mjs           # verify (CI / npm run check)
 *   node scripts/verify-prototype.mjs --write   # (re)create the lock – only with explicit approval
 *
 * When tahara-platform is extracted to its own repository, set TAHARA_STANDALONE=1.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const here = import.meta.dirname;
const repoRoot = path.resolve(here, '../..');
const lockPath = path.join(here, 'protected-files.lock.json');
const PROTECTED = ['tahara', 'family-cycle', 'legal-system', 'legal-dashboard (9).html'];

if (process.env.TAHARA_STANDALONE === '1') {
  console.log('verify-prototype: skipped (TAHARA_STANDALONE=1)');
  process.exit(0);
}

function walk(rel, out) {
  const abs = path.join(repoRoot, rel);
  const st = statSync(abs);
  if (st.isDirectory()) {
    for (const name of readdirSync(abs).sort()) {
      if (name === 'node_modules' || name === '.git') continue;
      walk(path.posix.join(rel, name), out);
    }
  } else {
    out[rel] = createHash('sha256').update(readFileSync(abs)).digest('hex');
  }
}

function snapshot() {
  const files = {};
  for (const p of PROTECTED) {
    if (!existsSync(path.join(repoRoot, p))) throw new Error(`Protected path is missing: ${p}`);
    walk(p, files);
  }
  return files;
}

if (process.argv.includes('--write')) {
  const files = snapshot();
  writeFileSync(lockPath, JSON.stringify({ protected: PROTECTED, files }, null, 2) + '\n');
  console.log(`verify-prototype: wrote lock for ${Object.keys(files).length} files`);
  process.exit(0);
}

const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
let current;
try {
  current = snapshot();
} catch (e) {
  console.error(`verify-prototype: FAILED – ${e.message}`);
  process.exit(1);
}

const problems = [];
for (const [file, hash] of Object.entries(lock.files)) {
  if (!(file in current)) problems.push(`deleted:  ${file}`);
  else if (current[file] !== hash) problems.push(`modified: ${file}`);
}
for (const file of Object.keys(current))
  if (!(file in lock.files)) problems.push(`added:    ${file}`);

if (problems.length) {
  console.error('verify-prototype: FAILED – protected files changed:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`verify-prototype: OK – ${Object.keys(lock.files).length} protected files unchanged`);
