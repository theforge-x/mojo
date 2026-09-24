'use client';

import { Alert, Button, Field, FieldLabel, Input, Textarea } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function FileDisputeForm() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, filedBy: 'student', reason }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not file dispute.');
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not file dispute.');
    } finally {
      setBusy(false);
    }
  }

  if (done) return <Alert>Dispute filed — it now shows in the queue below.</Alert>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && <Alert variant="danger">{error}</Alert>}
      <Field>
        <FieldLabel htmlFor="dispute-session-id">Session id</FieldLabel>
        <Input
          id="dispute-session-id"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="e.g. s_5"
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="dispute-reason">What happened?</FieldLabel>
        <Textarea
          id="dispute-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="A short description of the issue."
          required
        />
      </Field>
      <Button type="submit" disabled={busy}>
        {busy ? 'Filing…' : 'File dispute'}
      </Button>
    </form>
  );
}
