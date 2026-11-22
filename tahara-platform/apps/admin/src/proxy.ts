import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_ROBOTS, PRIVATE_NO_STORE, buildCsp, createNonce } from '@tahara/security';
import { isAdminPreviewEnabled } from '@/lib/preview';

/**
 * Admin proxy.
 *  - Stage 1: everything returns 404 unless ADMIN_PREVIEW_ENABLED === "true".
 *  - Always: strict CSP with nonce, no-store, noindex.
 * From stage 2 it will also redirect to /login for UX; real enforcement is
 * server-side (requireAdmin + aal2) and in the database (RPC checks + RLS).
 */
export function proxy(request: NextRequest) {
  if (!isAdminPreviewEnabled()) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'Cache-Control': PRIVATE_NO_STORE,
        'X-Robots-Tag': ADMIN_ROBOTS,
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  const nonce = createNonce();
  const csp = buildCsp({ nonce, isDev: process.env.NODE_ENV === 'development' });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cache-Control', PRIVATE_NO_STORE);
  response.headers.set('X-Robots-Tag', ADMIN_ROBOTS);
  return response;
}

export const config = {
  matcher: ['/:path*'],
};
