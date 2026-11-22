import { APP_FEATURES } from '@/config/features';

/** Routes that will show personal data (and the auth flow). Never cacheable. */
export const PRIVATE_ROUTE_PREFIXES: readonly string[] = [
  ...APP_FEATURES.map((f) => f.href),
  '/login',
  '/auth',
  '/api',
];

export function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
