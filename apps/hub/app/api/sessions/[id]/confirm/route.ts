import { NextResponse } from 'next/server';
import { getHub } from '../../../../../demo/composition-root';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await getHub().booking.confirmDelivery({
      sessionId: id,
      confirmedBy: 'student',
      nowIso: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Confirmation failed.' },
      { status: 409 },
    );
  }
}
