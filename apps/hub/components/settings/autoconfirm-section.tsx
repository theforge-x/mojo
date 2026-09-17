import { AUTO_CONFIRM_WINDOW_HOURS } from '@mojo/booking/domain';
import { Button } from '@mojo/shared/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatWhen } from '../../lib/format';
import { ConfirmDeliveryButton } from '../session-actions';

export interface PendingConfirmation {
  readonly id: string;
  readonly tutorName: string;
  readonly startIso: string;
  readonly endIso: string;
}

/**
 * Delivery confirmations. Lessons auto-confirm {@link AUTO_CONFIRM_WINDOW_HOURS}h
 * after they happen so payouts never stall; confirming early releases the
 * tutor's take-home sooner.
 */
export function StudentAutoconfirm({ pending }: { pending: readonly PendingConfirmation[] }) {
  return (
    <div className="space-y-3">
      <p className="max-w-prose text-sm text-muted-foreground">
        Finished lessons auto-confirm {AUTO_CONFIRM_WINDOW_HOURS} hours after they happen. Confirm
        early below and your tutor gets paid sooner.
      </p>
      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing waiting on you right now.</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
            >
              <span className="text-sm">
                <span className="font-medium text-headline">{session.tutorName}</span>{' '}
                <span className="text-muted-foreground">
                  · {formatWhen(session.startIso, session.endIso)}
                </span>
              </span>
              <ConfirmDeliveryButton sessionId={session.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TutorAutoconfirm({
  awaitingStudent,
  upcoming,
}: {
  awaitingStudent: number;
  upcoming: number;
}) {
  return (
    <div className="space-y-3">
      <p className="max-w-prose text-sm text-muted-foreground">
        Students confirm delivery after each lesson; anything unconfirmed auto-confirms{' '}
        {AUTO_CONFIRM_WINDOW_HOURS} hours after the session, which releases your take-home.
      </p>
      <div className="flex gap-6 text-sm">
        <span>
          Upcoming <strong className="text-headline">{upcoming}</strong>
        </span>
        <span>
          Awaiting student confirmation <strong className="text-headline">{awaitingStudent}</strong>
        </span>
      </div>
      <Link href="/tutor">
        <Button variant="outline" size="sm">
          Manage sessions
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </Link>
    </div>
  );
}
