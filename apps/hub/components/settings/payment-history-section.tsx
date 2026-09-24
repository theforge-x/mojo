import { Button } from '@mojo/shared/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatMinor } from '../../lib/format';

export interface HistoryCharge {
  readonly id: string;
  readonly tutorName: string;
  readonly totalMinor: number;
  readonly status: string;
}

export function StudentPaymentHistory({
  paidMinor,
  refundedMinor,
  recent,
}: {
  paidMinor: number;
  refundedMinor: number;
  recent: readonly HistoryCharge[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-6 text-sm">
        <span>
          Paid <strong className="text-headline">{formatMinor(paidMinor)}</strong>
        </span>
        <span>
          Refunded <strong className="text-headline">{formatMinor(refundedMinor)}</strong>
        </span>
      </div>
      {recent.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {recent.map((charge) => (
            <li
              key={charge.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <span className="min-w-0 truncate text-muted-foreground">
                <span className="font-medium text-headline">{charge.tutorName}</span> ·{' '}
                {charge.status.replace('_', ' ')}
              </span>
              <span className="shrink-0 font-medium text-headline">
                {formatMinor(charge.totalMinor)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link href="/payments">
        <Button variant="outline" size="sm">
          Full payment history
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </Link>
    </div>
  );
}

export function TutorPaymentHistory({ balance }: { balance: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Wallet balance <strong className="font-display text-xl text-headline">{balance}</strong>
      </p>
      <p className="max-w-prose text-sm text-muted-foreground">
        Payouts, per-lesson earnings, and the release flow live on your tutor dashboard.
      </p>
      <Link href="/tutor">
        <Button variant="outline" size="sm">
          Open tutor dashboard
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </Link>
    </div>
  );
}
