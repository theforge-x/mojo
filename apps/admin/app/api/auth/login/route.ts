import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

function cookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  };
}

/**
 * Admin sign-in. Demo mode proxies credentials to the hub (the system of
 * record for users) and forwards its session cookies; the Prisma path
 * validates against the shared database directly.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Email and password required.' }, { status: 400 });
  }

  if (process.env.USE_PRISMA !== 'true') {
    const base = (
      process.env.HUB_URL === undefined ? 'http://localhost:3003' : process.env.HUB_URL
    ).replace(/\/$/, '');
    try {
      const response = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        role?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || data.role !== 'admin') {
        return NextResponse.json(
          { ok: false, error: 'Admin sign-in required.' },
          { status: 401 },
        );
      }
      const out = NextResponse.json({ ok: true });
      const setCookie = response.headers.getSetCookie?.() ?? [];
      for (const header of setCookie) {
        const pair = header.split(';')[0] ?? '';
        const eq = pair.indexOf('=');
        if (eq > 0) {
          const name = pair.slice(0, eq).trim();
          const value = pair.slice(eq + 1).trim();
          if (name) out.cookies.set(name, value, cookieOptions());
        }
      }
      return out;
    } catch {
      return NextResponse.json({ ok: false, error: 'Hub unreachable.' }, { status: 502 });
    }
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'admin' || user.suspendedAt) {
      return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
    }
    const ok = await compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
    }
    // DB-backed opaque session (same format the hub issues in Prisma mode).
    const token = `mojo_${crypto.randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const { createHash } = await import('node:crypto');
    await prisma.sessionToken.create({
      data: {
        tokenHash: createHash('sha256').update(token).digest('hex'),
        userId: user.id,
        expiresAt,
      },
    });
    const out = NextResponse.json({ ok: true });
    out.cookies.set('mojo_user', token, cookieOptions());
    out.cookies.set('mojo_role', 'admin', cookieOptions());
    return out;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
