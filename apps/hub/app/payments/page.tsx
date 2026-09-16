import { Badge, Card, CardContent, Empty, EmptyDescription } from '@mojo/shared/ui';
import { redirect } from 'next/navigation';
import { RefundChargeButton } from '../../components/refund-charge-button';
import { getHub } from '../../demo/composition-root';
import { formatMinor, formatWhen } from '../../lib/format';
import { currentUser } from '../../lib/session';

/**
 * The student's receipts — every lesson charge with its segment breakdown,
 * trial discount where one applied, and the refund path for cancelled
 * sessions.
 */
export default async function PaymentsPage() {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'student') redirect('/tutor');

  const hub = getHub();
  const [charges, refunds, sessions] = await Promise.all([
    hub.billing.chargesByStudent(user.id),
    hub.billing.refundsByStudent(user.id),
    hub.scheduling.sessionsByStudent(user.id),
  ]);
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const refundsByCharge = new Map<string, typeof refunds>();
  for (const refund of refunds) {
    refundsByCharge.set(refund.chargeId, [...(refundsByCharge.get(refund.chargeId) ?? []), refund]);
  }
  const tutorName = async (tutorId: string) =>
    (await hub.profile.byTutor(tutorId))?.displayName ?? 'Your tutor';
  const names = new Map<string, string>();
  for (const charge of charges) {
    if (!names.has(charge.tutorId)) names.set(charge.tutorId, await tutorName(charge.tutorId));
  }

  const totalPaid = charges.reduce((sum, c) => sum + c.totalMinor, 0);
  const totalRefunded = refunds.reduce((sum, r) => sum + r.amountMinor, 0);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-headline">Payments</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Every lesson charge, what it covered, and what came back.
      </p>

      <div className="mb-6 flex gap-6 text-sm">
        <span>
          Paid <strong>{formatMinor(totalPaid)}</strong>
        </span>
        <span>
          Refunded <strong>{formatMinor(totalRefunded)}</strong>
        </span>
      </div>

      {charges.length === 0 ? (
        <Card>
          <CardContent>
            <Empty>
              <EmptyDescription>
                No charges yet — find a tutor and book your first lesson.
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {charges.map((charge) => {
            const session = sessionById.get(charge.sessionId);
            const chargeRefunds = refundsByCharge.get(charge.id) ?? [];
            const refundable = charge.status !== 'refunded' && session?.status === 'cancelled';
            return (
              <Card key={charge.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm font-medium">
                      {names.get(charge.tutorId)} —{' '}
                      {session ? formatWhen(session.startIso, session.endIso) : 'session removed'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {charge.segments} segments × {formatMinor(charge.perSegmentMinor)}
                      {charge.isTrial && charge.trialDiscountMinor > 0
                        ? ` · trial −${formatMinor(charge.trialDiscountMinor)}`
                        : ''}
                      {chargeRefunds.length > 0 &&
                        ` · refunded ${formatMinor(chargeRefunds.reduce((s, r) => s + r.amountMinor, 0))}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatMinor(charge.totalMinor)}</span>
                    <Badge variant={charge.status === 'captured' ? 'primary' : 'secondary'}>
                      {charge.status === 'captured'
                        ? (session?.status ?? 'booked')
                        : charge.status.replace('_', ' ')}
                    </Badge>
                    {refundable && <RefundChargeButton chargeId={charge.id} />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
