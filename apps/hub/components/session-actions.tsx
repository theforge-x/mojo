'use client';

import { Alert, Button } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function StartSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/start`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not start session.');
      router.push(`/tutor/lab/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start session.');
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-1">
      <Button size="sm" onClick={handleClick} disabled={busy}>
        {busy ? 'Starting…' : 'Start live lab'}
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
    </div>
  );
}

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

export function CompleteSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Completion failed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Completion failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" onClick={handleClick} disabled={busy}>
        {busy ? 'Completing…' : 'Mark complete'}
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
