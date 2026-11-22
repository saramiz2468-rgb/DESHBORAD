import { describe, expect, it } from 'vitest';
import { isPrivateRoute } from './routes';

describe('isPrivateRoute', () => {
  it.each([
    '/today',
    '/calendar',
    '/halacha',
    '/settings',
    '/import',
    '/login',
    '/auth/callback',
    '/api/x',
  ])('%s is private', (p) => expect(isPrivateRoute(p)).toBe(true));
  it.each(['/', '/legal/privacy', '/offline.html', '/todayx'])('%s is public', (p) =>
    expect(isPrivateRoute(p)).toBe(false),
  );
});
