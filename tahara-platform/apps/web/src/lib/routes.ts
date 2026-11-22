import { ALL_ROUTES } from '@/config/navigation';

/** Routes that show personal data (and the auth flow). Never cacheable. */
export const PRIVATE_ROUTE_PREFIXES: readonly string[] = [
  ...ALL_ROUTES.map((r) => r.href),
  '/login',
  '/auth',
  '/api',
];

export function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
