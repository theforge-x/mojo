import { ChargeNotCapturedError, UnknownReferenceError } from '@mojo/payments/application';
import { Button, Card, CardContent, Empty, EmptyDescription, EmptyTitle } from '@mojo/shared/ui';
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getHub } from '../../../demo/composition-root';
import { formatMinor } from '../../../lib/format';
import { currentUser } from '../../../lib/session';

/** Paystack redirect landing: settles the reference and shows the outcome. */
export default async function VerifyPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'student') redirect('/tutor');

  const { reference } = await searchParams;
  if (!reference) redirect('/payments');

  let outcome: { ok: true; totalMinor: number } | { ok: false; message: string };
  try {
    const charge = await getHub().billing.captureCharge(reference);
    if (charge.studentId !== user.id) redirect('/payments');
    outcome = { ok: true, totalMinor: charge.totalMinor };
  } catch (error) {
    if (error instanceof UnknownReferenceError) redirect('/payments');
    outcome = {
      ok: false,
      message:
        error instanceof ChargeNotCapturedError
          ? 'The payment was not approved — no money moved. Your slot was released; try again.'
          : 'We could not confirm this payment yet — check back in a minute.',
    };
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          {outcome.ok ? (
            <Empty>
              <CheckCircle2 className="size-10 text-primary" aria-hidden />
              <EmptyTitle>Payment confirmed</EmptyTitle>
              <EmptyDescription>
                {outcome.totalMinor > 0 ? (
                  <>
                    {formatMinor(outcome.totalMinor)} captured — your lesson is booked and your card
                    is saved for one-click rebooking.
                  </>
                ) : (
                  <>Your free lesson is booked.</>
                )}
              </EmptyDescription>
            </Empty>
          ) : (
            <Empty>
              <XCircle className="size-10 text-destructive" aria-hidden />
              <EmptyTitle>Payment not completed</EmptyTitle>
              <EmptyDescription>{outcome.message}</EmptyDescription>
            </Empty>
          )}
          <div className="flex gap-2">
            <Link href="/">
              <Button size="sm">Back to lessons</Button>
            </Link>
            <Link href="/payments">
              <Button size="sm" variant="outline">
                Payment history
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
