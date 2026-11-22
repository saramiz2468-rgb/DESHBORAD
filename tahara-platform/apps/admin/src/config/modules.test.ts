import { describe, expect, it } from 'vitest';
import { ADMIN_MODULES, FORBIDDEN_ADMIN_FIELDS } from './modules';

describe('admin modules', () => {
  it('are all planned in stage 1 (no fake data, nothing active)', () => {
    for (const m of ADMIN_MODULES) expect(m.status).toBe('planned');
  });

  it('cover all required business areas', () => {
    const keys = ADMIN_MODULES.map((m) => m.key);
    for (const k of [
      'purchases',
      'revenue',
      'users',
      'entitlements',
      'refunds',
      'coupons',
      'support',
      'audit',
    ]) {
      expect(keys).toContain(k);
    }
  });

  it('never expose personal medical or halachic content', () => {
    for (const m of ADMIN_MODULES) {
      for (const field of m.fields) {
        for (const word of FORBIDDEN_ADMIN_FIELDS) expect(field).not.toContain(word);
      }
    }
  });

  it('offer no time-based expiry action for lifetime entitlements', () => {
    const e = ADMIN_MODULES.find((m) => m.key === 'entitlements');
    expect(e?.description).toContain('בלי תפוגה אוטומטית');
    expect(JSON.stringify(e)).not.toMatch(/תאריך תפוגה|expires/);
  });
});
