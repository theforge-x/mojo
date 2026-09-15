import { createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

export interface AdminUser {
  readonly id: string;
  readonly email: string;
  readonly role: 'admin';
}

function hubBaseUrl(): string {
  if (process.env.USE_PRISMA === 'true') return '';
  return (process.env.HUB_URL === undefined ? 'http://localhost:3003' : process.env.HUB_URL).replace(
    /\/$/,
    '',
  );
}

/** Resolves the signed-in admin via the hub (demo bridge) or the shared DB. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const store = await cookies();
  const token = store.get('mojo_user')?.value;
  if (!token) return null;

  if (process.env.USE_PRISMA === 'true') {
    const prisma = new PrismaClient();
    try {
      // DB-backed `mojo_` sessions first; legacy `demo-` tokens resolve via
      // the embedded user id for backwards compatibility.
      let userId: string | null = null;
      if (token.startsWith('mojo_')) {
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const session = await prisma.sessionToken.findUnique({ where: { tokenHash } });
        if (!session || session.expiresAt.getTime() < Date.now()) return null;
        userId = session.userId;
      } else if (token.startsWith('demo-')) {
        userId = token.slice('demo-'.length).split('-')[0] ?? null;
      }
      if (!userId) return null;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== 'admin' || user.suspendedAt) return null;
      return { id: user.id, email: user.email, role: 'admin' };
    } catch {
      return null;
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  }

  const base = hubBaseUrl();
  if (!base) return null;
  try {
    const response = await fetch(`${base}/api/me`, {
      headers: { cookie: `mojo_user=${token}` },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { user?: { id: string; email: string; role: string } };
    if (!data.user || data.user.role !== 'admin') return null;
    return { id: data.user.id, email: data.user.email, role: 'admin' };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminUser | null> {
  return currentAdmin();
}
