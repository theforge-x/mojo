'use client';

import { TRIAL_PRICE_PERCENT } from '@mojo/payments/domain';
import { Alert, Button } from '@mojo/shared/ui';
import { segmentsBetween } from '@mojo/shared/util';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatMinor } from '../lib/format';

export interface BookButtonProps {
  tutorId: string;
  studentId: string;
  startIso: string;
  endIso: string;
  perSegmentMinor: number;
  /** Hides the trial option once the student has used it with this tutor. */
  trialUsed: boolean;
}

export function BookButton({
  tutorId,
  studentId,
  startIso,
  endIso,
  perSegmentMinor,
  trialUsed,
}: BookButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const segments = segmentsBetween(startIso, endIso);
  const standardTotal = segments * perSegmentMinor;
  const total =
    !trialUsed && isTrial ? Math.round((standardTotal * TRIAL_PRICE_PERCENT) / 100) : standardTotal;

  async function handleClick() {
    setBusy(true);
    setError(null);
    setConfirmation(null);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId,
          studentId,
          startIso,
          endIso,
          isTrial: !trialUsed && isTrial,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Booking failed.');
      setConfirmation(
        `Booked — ${formatMinor(body.charge?.totalMinor ?? total)} charged to your card.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <span className="text-sm font-medium">{formatMinor(total)}</span>
      {!trialUsed && (
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={isTrial}
            onChange={(event) => setIsTrial(event.target.checked)}
            disabled={busy}
          />
          First lesson trial (−{100 - TRIAL_PRICE_PERCENT}%)
        </label>
      )}
      <Button size="sm" onClick={handleClick} disabled={busy}>
        {busy ? 'Booking…' : 'Book this slot'}
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
      {confirmation && <Alert variant="info">{confirmation}</Alert>}
    </div>
  );
}
