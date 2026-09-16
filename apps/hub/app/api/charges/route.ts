import { NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';
import { requireRole } from '../../../lib/session';

/** The student's own receipts — every charge with its segment breakdown. */
export async function GET() {
  const user = await requireRole('student');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Student sign-in required.' }, { status: 401 });
  }

  const hub = getHub();
  const [charges, refunds] = await Promise.all([
    hub.billing.chargesByStudent(user.id),
    hub.billing.refundsByStudent(user.id),
  ]);
  return NextResponse.json({ ok: true, charges, refunds });
}
