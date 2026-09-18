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
  /** A granted free-replacement entitlement with this tutor, if any. */
  replacementGrantId?: string;
}

export function BookButton({
  tutorId,
  studentId,
  startIso,
  endIso,
  perSegmentMinor,
  trialUsed,
  replacementGrantId,
}: BookButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [useReplacement, setUseReplacement] = useState(Boolean(replacementGrantId));
  const [needsCard, setNeedsCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const segments = segmentsBetween(startIso, endIso);
  const standardTotal = segments * perSegmentMinor;
  const replacing = Boolean(replacementGrantId) && useReplacement;
  const total = replacing
    ? 0
    : !trialUsed && isTrial
      ? Math.round((standardTotal * TRIAL_PRICE_PERCENT) / 100)
      : standardTotal;

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
          replacementGrantId: replacing ? replacementGrantId : undefined,
        }),
      });
      const body = await response.json();
      if (response.status === 402 && !replacing) {
        // No usable card on file — flip to the redirect checkout instead of
        // leaving the student stuck.
        setNeedsCard(true);
        setError(null);
        return;
      }
      if (!response.ok) throw new Error(body.error ?? 'Booking failed.');
      setConfirmation(
        replacing
          ? 'Booked free with your replacement lesson.'
          : `Booked — ${formatMinor(body.charge?.totalMinor ?? total)} charged to your card.`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed.');
    } finally {
      setBusy(false);
    }
  }

  async function payWithCard() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId, startIso, endIso, isTrial: !trialUsed && isTrial }),
      });
      const body = await response.json();
      if (!response.ok || !body.authorizationUrl) {
        throw new Error(body.error ?? 'Could not start card payment.');
      }
      window.location.href = body.authorizationUrl as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start card payment.');
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-2">
      <span className="text-sm font-medium">
        {replacing ? 'Free · replacement' : formatMinor(total)}
      </span>
      {replacementGrantId && (
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={useReplacement}
            onChange={(event) => setUseReplacement(event.target.checked)}
            disabled={busy}
          />
          Use free replacement lesson
        </label>
      )}
      {!trialUsed && !replacing && (
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
      <Button size="sm" onClick={handleClick} disabled={busy} className="w-full">
        {busy ? 'Booking…' : 'Book this slot'}
      </Button>
      {needsCard && !confirmation && (
        <Button
          size="sm"
          variant="secondary"
          onClick={payWithCard}
          disabled={busy}
          className="w-full"
        >
          {busy ? 'Starting…' : 'Continue to Paystack'}
        </Button>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {confirmation && <Alert variant="info">{confirmation}</Alert>}
    </div>
  );
}
