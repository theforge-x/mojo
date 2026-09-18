import { ChargeNotCapturedError, UnknownReferenceError } from '@mojo/payments/application';
import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';

/**
 * Paystack event bridge. Verifies the HMAC signature before trusting a byte,
 * settles `charge.success` events idempotently, and acknowledges everything
 * else so Paystack stops retrying. Only adapter/network failures 500 (retry);
 * settled, failed, and unknown references all 200.
 */
export async function POST(request: Request) {
  const hub = getHub();
  const payload = await request.text();
  const signature = request.headers.get('x-paystack-signature');
  if (!hub.billing.verifyWebhookSignature(payload, signature)) {
    return NextResponse.json({ ok: false, error: 'Bad signature.' }, { status: 401 });
  }

  let event: string | undefined;
  let reference: string | undefined;
  try {
    const body = JSON.parse(payload) as {
      event?: unknown;
      data?: { reference?: unknown };
    };
    event = typeof body.event === 'string' ? body.event : undefined;
    reference =
      typeof body.data?.reference === 'string' ? (body.data.reference as string) : undefined;
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad payload.' }, { status: 400 });
  }

  if (event !== 'charge.success' || !reference) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    await hub.billing.captureCharge(reference);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof UnknownReferenceError || error instanceof ChargeNotCapturedError) {
      return NextResponse.json({ ok: true, noted: true });
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Capture failed.' },
      { status: 500 },
    );
  }
}
