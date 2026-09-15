import { type NextRequest, NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';
import { isBridgeRequest } from '../../../../../lib/bridge';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const hub = getHub();

  // Closed endpoint: only a signed-in admin or the server-to-server demo
  // bridge may approve/reject. Previously anyone could call this.
  if (!isBridgeRequest(request)) {
    const token = request.cookies.get('mojo_user')?.value;
    const user = token ? await hub.identity.userByToken(token) : null;
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
    }
  }

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
