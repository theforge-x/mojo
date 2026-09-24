import { type NextRequest, NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { isBridgeRequest } from '../../../../lib/bridge';

/**
 * Admin-console bridge for the subject catalogue. Closed like the
 * applications bridge: a signed-in hub admin or the server-to-server demo
 * bridge (`x-mojo-bridge`). Mutations run the catalogue use-cases, so every
 * subject stays inside a domain and deactivation cascades.
 */
async function requireCatalogAccess(request: NextRequest) {
  if (isBridgeRequest(request)) return null;
  const hub = getHub();
  const token = request.cookies.get('mojo_user')?.value;
  const user = token ? await hub.identity.userByToken(token) : null;
  if (user?.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = await requireCatalogAccess(request);
  if (denied) return denied;
  const entries = await getHub().catalog.list();
  return NextResponse.json({ ok: true, entries });
}

export async function POST(request: NextRequest) {
  const denied = await requireCatalogAccess(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  const name = typeof body.name === 'string' ? body.name : '';
  const parentId =
    body.parentId === null || typeof body.parentId === 'string' ? body.parentId : undefined;
  const active = typeof body.active === 'boolean' ? body.active : undefined;
  if (!id || !name || parentId === undefined) {
    return NextResponse.json(
      { ok: false, error: 'id, name and parentId (null for a domain) are required.' },
      { status: 422 },
    );
  }
  try {
    const entry = await getHub().catalog.save({ id, name, parentId, active });
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Save failed.' },
      { status: 409 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireCatalogAccess(request);
  if (denied) return denied;
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  const active = typeof body.active === 'boolean' ? body.active : undefined;
  if (!id || active === undefined) {
    return NextResponse.json({ ok: false, error: 'id and active are required.' }, { status: 422 });
  }
  try {
    const entry = await getHub().catalog.setActive(id, active);
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Update failed.' },
      { status: 409 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireCatalogAccess(request);
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get('id') ?? '';
  if (!id) {
    return NextResponse.json({ ok: false, error: 'id is required.' }, { status: 422 });
  }
  try {
    await getHub().catalog.remove(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Remove failed.' },
      { status: 409 },
    );
  }
}
