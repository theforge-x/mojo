import { NextResponse } from 'next/server';
import { getAdmin } from '../../../demo/composition-root';
import { requireAdmin } from '../../../lib/session';

function hubError(error: unknown, fallback: string): NextResponse {
  return NextResponse.json(
    { ok: false, error: error instanceof Error ? error.message : fallback },
    { status: 409 },
  );
}

/** Creates or renames a subject domain (`parentId: null`) or a subject. */
export async function POST(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  const name = typeof body.name === 'string' ? body.name : '';
  const parentId =
    body.parentId === null || typeof body.parentId === 'string' ? body.parentId : undefined;
  if (!id || !name || parentId === undefined) {
    return NextResponse.json(
      { ok: false, error: 'id, name and parentId (null for a domain) are required.' },
      { status: 422 },
    );
  }
  try {
    const entry = await getAdmin().catalog.save({ id, name, parentId });
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch (error) {
    return hubError(error, 'Could not save entry.');
  }
}

/** Activates/deactivates a domain or subject (domain off cascades). */
export async function PATCH(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  const active = typeof body.active === 'boolean' ? body.active : undefined;
  if (!id || active === undefined) {
    return NextResponse.json({ ok: false, error: 'id and active are required.' }, { status: 422 });
  }
  try {
    const entry = await getAdmin().catalog.setActive(id, active);
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    return hubError(error, 'Could not update entry.');
  }
}

/** Removes a subject, or a domain once it has no subjects left. */
export async function DELETE(request: Request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!id) {
    return NextResponse.json({ ok: false, error: 'id is required.' }, { status: 422 });
  }
  try {
    await getAdmin().catalog.remove(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return hubError(error, 'Could not remove entry.');
  }
}
