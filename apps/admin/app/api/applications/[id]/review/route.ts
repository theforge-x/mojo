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

  try {
    const decision = body.decision;
    if (decision !== 'approved' && decision !== 'rejected' && decision !== 'in_review') {
      return NextResponse.json(
        { ok: false, error: 'decision must be "approved", "rejected" or "in_review".' },
        { status: 422 },
      );
    }
    const note = typeof body.note === 'string' ? body.note : undefined;
    const application = await getAdmin().applications.review({ applicationId: id, decision, note });
    return NextResponse.json({ ok: true, application });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Review failed.' },
      { status: 409 },
    );
  }
}
