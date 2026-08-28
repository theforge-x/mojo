import { NextResponse } from 'next/server';
import { getAdmin } from '../../../../../demo/composition-root';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const decision = body.decision === 'rejected' ? 'rejected' : 'approved';
    const application = await getAdmin().applications.review({ applicationId: id, decision });
    return NextResponse.json({ ok: true, application });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Review failed.' },
      { status: 409 },
    );
  }
}