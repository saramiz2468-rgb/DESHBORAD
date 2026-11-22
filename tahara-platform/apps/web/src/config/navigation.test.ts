import { describe, expect, it } from 'vitest';
import { ALL_ROUTES, MORE_NAV, PRIMARY_NAV } from './navigation';

describe('navigation', () => {
  it('has exactly the five bottom-bar areas from the spec', () => {
    expect(PRIMARY_NAV.map((n) => n.label)).toEqual(['בית', 'לוח שנה', 'מעקב', 'טהרה', 'עוד']);
  });

  it('puts the secondary areas under "עוד"', () => {
    expect(MORE_NAV.map((n) => n.label)).toEqual([
      'פוריות וביוץ',
      'סטטיסטיקות',
      'היסטוריה',
      'תזכורות',
      'הגדרות',
      'פרטיות ואבטחה',
      'תמיכה',
    ]);
  });

  it('has unique routes', () => {
    expect(new Set(ALL_ROUTES.map((r) => r.href)).size).toBe(ALL_ROUTES.length);
  });
});
