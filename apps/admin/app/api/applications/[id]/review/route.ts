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
    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json(
        { ok: false, error: 'decision must be "approved" or "rejected".' },
        { status: 422 },
      );
    }
    const application = await getAdmin().applications.review({ applicationId: id, decision });
    return NextResponse.json({ ok: true, application });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Review failed.' },
      { status: 409 },
    );
  }
}
