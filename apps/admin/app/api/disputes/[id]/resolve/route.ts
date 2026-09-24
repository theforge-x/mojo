import { NextResponse } from 'next/server';
import { getAdmin } from '../../../../../demo/composition-root';
import { requireAdmin } from '../../../../../lib/session';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const outcome = body.outcome;
  if (outcome !== 'upheld' && outcome !== 'dismissed') {
    return NextResponse.json(
      { ok: false, error: 'outcome must be "upheld" or "dismissed".' },
      { status: 422 },
    );
  }
  try {
    await getAdmin().disputes.resolve({ disputeId: id, outcome });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Resolve failed.' },
      { status: 409 },
    );
  }
}
