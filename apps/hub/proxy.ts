import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** First path segment -> role that may access it (students own the root-level routes). */
const SEGMENT_ROLES: Record<string, string> = {
  tutor: 'tutor',
  tutors: 'student',
  lab: 'student',
};

/** Segments that need any signed-in user (page-level redirects are the fallback). */
const AUTH_REQUIRED = new Set(['messages', 'settings', 'profile', 'saved-tutors']);

/**
 * Route-level gate. The real session/role lookup happens server-side via
 * `currentUser()` (DB role, never the cookie) — this proxy only enforces
 * the shape: no session token at all -> landing/login, wrong role -> home.
 * It can't be the sole authorization check because `mojo_role` is
 * client-writable; every mutating API re-verifies via `requireUser()`.
 */
export function proxy(request: NextRequest) {
  const first = request.nextUrl.pathname.split('/')[1];
  if (!first) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get('mojo_user')?.value);

  if (AUTH_REQUIRED.has(first)) {
    if (!hasSession) return NextResponse.redirect(new URL('/', request.url));
    return NextResponse.next();
  }

  const requiredRole = SEGMENT_ROLES[first];
  if (!requiredRole) return NextResponse.next();

  if (!hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  const sessionRole = request.cookies.get('mojo_role')?.value;
  if (sessionRole !== requiredRole) {
    // Authenticated wrong role -> their home; guests -> the landing page.
    const destination = sessionRole === 'tutor' ? '/tutor' : '/';
    return NextResponse.redirect(new URL(destination, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/tutor/:path*',
    '/tutors/:path*',
    '/lab/:path*',
    '/messages/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/saved-tutors/:path*',
  ],
};
