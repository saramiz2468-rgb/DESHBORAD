import { NextResponse, type NextRequest } from 'next/server';
import { buildCsp, createNonce, PRIVATE_NO_STORE } from '@tahara/security';
import { isPrivateRoute } from '@/lib/routes';

/**
 * Runs on every page request.
 *  - Per-request CSP nonce (scripts without it never execute).
 *  - Personal-area routes are marked `private, no-store` so no browser, proxy or CDN cache keeps them.
 *
 * NOTE: this is NOT an authorization layer. From stage 2 it will only redirect for UX;
 * every read/write is enforced again on the server (requireUser/requireEntitlement) and in RLS.
 */
export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const csp = buildCsp({ nonce, isDev: process.env.NODE_ENV === 'development' });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  if (isPrivateRoute(request.nextUrl.pathname)) {
    response.headers.set('Cache-Control', PRIVATE_NO_STORE);
  }
  return response;
}

export const config = {
  matcher: [
    {
      source:
        '/((?!_next/static|_next/image|icons/|sw\\.js|offline\\.html|favicon\\.ico|robots\\.txt|manifest\\.webmanifest).*)',
    },
  ],
};
