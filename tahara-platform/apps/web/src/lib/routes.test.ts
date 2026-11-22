import { describe, expect, it } from 'vitest';
import { isPrivateRoute } from './routes';

describe('isPrivateRoute', () => {
  it.each([
    '/today',
    '/calendar',
    '/track',
    '/tahara',
    '/tahara/vestot',
    '/more',
    '/fertility',
    '/stats',
    '/history',
    '/reminders',
    '/settings',
    '/privacy',
    '/support',
    '/login',
    '/auth/callback',
    '/api/x',
  ])('%s is private', (p) => expect(isPrivateRoute(p)).toBe(true));
  it.each(['/', '/legal/privacy', '/offline.html', '/todayx'])('%s is public', (p) =>
    expect(isPrivateRoute(p)).toBe(false),
  );
});
