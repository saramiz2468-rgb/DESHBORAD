import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const script = path.join(import.meta.dirname, 'verify-prototype.mjs');

describe('verify-prototype', () => {
  it('passes on the untouched repository', () => {
    const out = execFileSync('node', [script], {
      encoding: 'utf8',
      env: { ...process.env, TAHARA_STANDALONE: '' },
    });
    expect(out).toMatch(/OK – \d+ protected files unchanged/);
  });

  it('protects the original TAHARA prototype', () => {
    const lock = JSON.parse(
      readFileSync(path.join(import.meta.dirname, 'protected-files.lock.json'), 'utf8'),
    );
    expect(lock.protected).toContain('tahara');
    expect(Object.keys(lock.files)).toEqual(
      expect.arrayContaining(['tahara/engine.js', 'tahara/app.js', 'tahara/index.html']),
    );
  });
});
