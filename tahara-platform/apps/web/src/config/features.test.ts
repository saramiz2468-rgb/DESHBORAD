import { describe, expect, it } from 'vitest';
import { APP_FEATURES, PRIMARY_NAV } from './features';

describe('stage 1 feature registry', () => {
  it('marks every screen as planned (nothing is presented as active)', () => {
    for (const f of APP_FEATURES) expect(f.status).toBe('planned');
  });

  it('has unique keys and routes', () => {
    expect(new Set(APP_FEATURES.map((f) => f.key)).size).toBe(APP_FEATURES.length);
    expect(new Set(APP_FEATURES.map((f) => f.href)).size).toBe(APP_FEATURES.length);
  });

  it('keeps the mobile bottom bar at five items or fewer', () => {
    expect(PRIMARY_NAV.length).toBeLessThanOrEqual(5);
  });

  it('states that halachic calculations require qualified approval', () => {
    const h = APP_FEATURES.find((f) => f.key === 'halacha');
    expect(h?.stage).toContain('גורם הלכתי מוסמך');
  });

  it('never asks for GPS location', () => {
    const text = JSON.stringify(APP_FEATURES);
    expect(text).toContain('בחירת עיר');
    expect(text).not.toMatch(/geolocation/i);
  });
});
