'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Alert } from '@mojo/shared/ui';

export function ConfirmDeliveryButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/confirm`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Confirmation failed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={handleClick} disabled={busy}>
        {busy ? 'Confirming…' : 'Confirm delivery'}
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
    </>
  );
}

export function CancelSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withinNoticeWindow: true }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Cancellation failed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleClick} disabled={busy}>
        {busy ? 'Cancelling…' : 'Cancel session'}
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
    </>
  );
}