'use client';

import { Button } from '@mojo/shared/ui';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export interface JoinLabButtonProps {
  labId: string;
  /** Current per-student total at the live seat count — null while unpriced. */
  perStudentMinor: number | null;
  seatsTaken: number;
  seatsTotal: number;
  /** The student's seat row, when they already hold one. */
  joinedSessionId: string | null;
  priceLabel: (minor: number) => string;
}

/**
 * Enroll into a group lab at the live ladder price. Joining charges the
 * saved card immediately (same rail as one-on-one booking); the seat count
 * — and everyone's price — updates once the tutor locks the lab.
 */
export function JoinLabButton({
  labId,
  perStudentMinor,
  seatsTaken,
  seatsTotal,
  joinedSessionId,
  priceLabel,
}: JoinLabButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seatSessionId, setSeatSessionId] = useState<string | null>(joinedSessionId);

  if (seatSessionId) {
    return (
      <Link href={`/lab/${seatSessionId}`} className="w-full sm:w-auto">
        <Button size="sm" variant="outline" className="w-full">
          Seat booked — open lab room
        </Button>
      </Link>
    );
  }

  const full = seatsTaken >= seatsTotal;
  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto">
      <Button
        size="sm"
        className="w-full"
        disabled={busy || full || perStudentMinor === null}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const response = await fetch(`/api/groups/${labId}/join`, { method: 'POST' });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error ?? 'Could not join this lab.');
            setSeatSessionId(body.session.id);
          } catch (joinError) {
            setError(joinError instanceof Error ? joinError.message : 'Could not join this lab.');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy
          ? 'Booking your seat…'
          : full
            ? 'Lab full'
            : perStudentMinor === null
              ? 'Price unavailable'
              : `Join group — ${priceLabel(perStudentMinor)}`}
      </Button>
      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="size-3" aria-hidden />
        {seatsTaken}/{seatsTotal} seats taken
      </p>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
