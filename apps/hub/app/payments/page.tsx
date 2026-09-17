import type { ChargeRefund, StudentCharge } from '@mojo/payments/domain';
import type { ScheduledSession } from '@mojo/scheduling/domain';
import { Badge, Card, CardContent, Empty, EmptyDescription } from '@mojo/shared/ui';
import { ReceiptText, Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';
import { RefundChargeButton } from '../../components/refund-charge-button';
import {
  parseSessionView,
  SessionGridCard,
  SessionListCard,
  toneForStatus,
} from '../../components/session-cards';
import { SessionViewToggle } from '../../components/session-view-toggle';
import { getHub } from '../../demo/composition-root';
import { formatMinor } from '../../lib/format';
import { currentUser } from '../../lib/session';

/**
 * The student's receipts — every lesson charge with its segment breakdown,
 * trial discount where one applied, and the refund path for cancelled
 * sessions.
 */
export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'student') redirect('/tutor');

  const params = await searchParams;
  const view = parseSessionView(params.view);

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

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-headline">
          <ReceiptText className="size-5 text-primary" aria-hidden />
          Receipts
          <span className="text-sm font-medium text-muted-foreground">({charges.length})</span>
        </h2>
        {charges.length > 0 && <SessionViewToggle view={view} />}
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
      ) : view === 'grid' ? (
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
          {charges.map((charge) => (
            <ReceiptGridCard
              key={charge.id}
              charge={charge}
              tutorName={names.get(charge.tutorId) ?? 'Your tutor'}
              session={sessionById.get(charge.sessionId)}
              chargeRefunds={refundsByCharge.get(charge.id) ?? []}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {charges.map((charge) => (
            <ReceiptListCard
              key={charge.id}
              charge={charge}
              tutorName={names.get(charge.tutorId) ?? 'Your tutor'}
              session={sessionById.get(charge.sessionId)}
              chargeRefunds={refundsByCharge.get(charge.id) ?? []}
            />
          ))}
        </div>
      )}
    </main>
  );
}

interface ReceiptInput {
  charge: StudentCharge;
  tutorName: string;
  session: ScheduledSession | undefined;
  chargeRefunds: ChargeRefund[];
}

function receiptProps({ charge, tutorName, session, chargeRefunds }: ReceiptInput) {
  const status = charge.status === 'captured' ? (session?.status ?? 'booked') : charge.status;
  const refundable = charge.status !== 'refunded' && session?.status === 'cancelled';
  const refundedTotal = chargeRefunds.reduce((sum, r) => sum + r.amountMinor, 0);
  return {
    startIso: session?.startIso ?? charge.createdAt,
    endIso: session?.endIso,
    tone: toneForStatus(status),
    title: tutorName,
    subtitle: `${charge.segments} segment${charge.segments === 1 ? '' : 's'} × ${formatMinor(charge.perSegmentMinor)}${charge.isTrial && charge.trialDiscountMinor > 0 ? ` · trial −${formatMinor(charge.trialDiscountMinor)}` : ''}${refundedTotal > 0 ? ` · refunded ${formatMinor(refundedTotal)}` : ''}`,
    badges: (
      <>
        <Badge variant={charge.status === 'captured' ? 'primary' : 'secondary'}>
          {status.replace('_', ' ')}
        </Badge>
        {charge.isTrial && (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3" aria-hidden />
            Trial
          </Badge>
        )}
      </>
    ),
    actions: (
      <>
        <p className="font-display text-2xl font-bold tracking-tight text-headline">
          {formatMinor(charge.totalMinor)}
        </p>
        {refundable && <RefundChargeButton chargeId={charge.id} />}
      </>
    ),
  } as const;
}

function ReceiptListCard(props: ReceiptInput) {
  return <SessionListCard {...receiptProps(props)} />;
}

function ReceiptGridCard(props: ReceiptInput) {
  return <SessionGridCard {...receiptProps(props)} />;
}
