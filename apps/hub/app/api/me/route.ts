import { NextResponse } from 'next/server';
import { currentUser } from '../../../lib/session';

/** Resolves the caller's DB-backed identity (used by the admin app login). */
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user });
}
