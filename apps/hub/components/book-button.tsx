'use client';

import { Alert, Button } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface BookButtonProps {
  tutorId: string;
  studentId: string;
  startIso: string;
  endIso: string;
}

export function BookButton({ tutorId, studentId, startIso, endIso }: BookButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId, studentId, startIso, endIso, isTrial: false }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Booking failed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={handleClick} disabled={busy}>
        {busy ? 'Booking…' : 'Book this slot'}
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
    </>
  );
}
