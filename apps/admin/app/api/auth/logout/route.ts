import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const token = (await cookies()).get('mojo_user')?.value;
  if (token?.startsWith('mojo_') && process.env.USE_PRISMA === 'true') {
    try {
      const { sharedAdminPrismaClient } = await import('../../../../demo/prisma-client');
      const { createHash } = await import('node:crypto');
      await sharedAdminPrismaClient().sessionToken.deleteMany({
        where: { tokenHash: createHash('sha256').update(token).digest('hex') },
      });
    } catch {
      // Cookie clearing below still signs the browser out.
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('mojo_user');
  response.cookies.delete('mojo_role');
  return response;
}
