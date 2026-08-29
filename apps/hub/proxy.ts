import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** First path segment -> role that may access it (students own the root-level routes). */
const SEGMENT_ROLES: Record<string, string> = {
  tutor: 'tutor',
  tutors: 'student',
  lab: 'student',
};

/**
 * Route-level role gate. The real session/role lookup goes through
 * @mojo/identity's application layer at the composition root — this
 * proxy only enforces the shape (redirect unauthenticated/mismatched
 * roles), it doesn't decide who's who.
 */
export function proxy(request: NextRequest) {
  const first = request.nextUrl.pathname.split('/')[1];
  const requiredRole = first ? SEGMENT_ROLES[first] : undefined;
  if (!requiredRole) return NextResponse.next();

  const sessionRole = request.cookies.get('mojo_role')?.value;
  if (sessionRole !== requiredRole) {
    // Authenticated wrong role -> their home; guests -> the landing page.
    const destination = sessionRole === 'tutor' ? '/tutor' : '/';
    return NextResponse.redirect(new URL(destination, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/tutor/:path*', '/tutors/:path*', '/lab/:path*'],
};
