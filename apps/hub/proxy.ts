import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_PREFIXES: Record<string, string> = {
  '/tutor': 'tutor',
  '/student': 'student',
};

/**
 * Route-level role gate. The real session/role lookup goes through
 * @mojo/identity's application layer at the composition root — this
 * proxy only enforces the shape (redirect unauthenticated/mismatched
 * roles), it doesn't decide who's who.
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const requiredRole = Object.entries(ROLE_PREFIXES).find(([prefix]) => path.startsWith(prefix))?.[1];
  if (!requiredRole) return NextResponse.next();

  const sessionRole = request.cookies.get('mojo_role')?.value;
  if (sessionRole !== requiredRole) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/tutor/:path*', '/student/:path*'] };
