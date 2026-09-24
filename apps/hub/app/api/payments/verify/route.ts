import { ChargeNotCapturedError, UnknownReferenceError } from '@mojo/payments/application';
import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { requireRole } from '../../../../lib/session';

/**
 * Programmatic payment settlement — the mobile half of the redirect flow.
 * Captures the Paystack reference opened by `initializeCharge` and returns
 * the settled charge as JSON (the web flow renders `/payments/verify`
 * instead). Ownership-checked: a reference only settles for the student who
 * booked it. Unknown references 404; unapproved payments 409 with the charge
 * marked failed, exactly like the page.
 */
export async function GET(request: Request) {
  const user = await requireRole('student');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Student sign-in required.' }, { status: 401 });
  }
  const reference = new URL(request.url).searchParams.get('reference') ?? '';
  if (!reference) {
    return NextResponse.json({ ok: false, error: 'Reference is required.' }, { status: 400 });
  }
  try {
    const charge = await getHub().billing.captureCharge(reference);
    if (charge.studentId !== user.id) {
      return NextResponse.json({ ok: false, error: 'This payment is not yours.' }, { status: 403 });
    }
    return NextResponse.json({ ok: true, charge });
  } catch (error) {
    if (error instanceof UnknownReferenceError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    if (error instanceof ChargeNotCapturedError) {
      return NextResponse.json(
        { ok: false, error: 'The payment was not approved — no money moved.' },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, error: 'We could not confirm this payment yet — check back in a minute.' },
      { status: 409 },
    );
  }
}
