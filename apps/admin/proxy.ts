import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Admin edge gate: lets the login page (and static assets) through, sends
 * everyone without a session token to /login. Role verification happens in
 * pages/APIs via `requireAdmin()` — the proxy can't do the DB lookup.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }
  if (pathname.startsWith('/logo.svg')) return NextResponse.next();
  const hasSession = Boolean(request.cookies.get('mojo_user')?.value);
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
