import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const hub = getHub();

  try {
    const decision = body.decision;
    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json(
        { ok: false, error: 'decision must be "approved" or "rejected".' },
        { status: 422 },
      );
    }
    const application = await hub.profile.review({ applicationId: id, decision });
    return NextResponse.json({ ok: true, application });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Review failed.' },
      { status: 409 },
    );
  }
}
