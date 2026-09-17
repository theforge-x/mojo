'use client';

import { Alert, Button, Textarea } from '@mojo/shared/ui';
import { Flag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DisputeButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function file() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, reason }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Could not file dispute.');
      setOpen(false);
      setReason('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not file dispute.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Flag className="size-4" aria-hidden />
        Report issue
      </Button>
    );
  }

  return (
    <form
      className="flex w-full flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void file();
      }}
    >
      <Textarea
        aria-label="Issue description"
        placeholder="What went wrong with this lesson?"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={3}
        required
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={busy || reason.trim().length < 10}
        >
          {busy ? 'Filing…' : 'File dispute'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            setOpen(false);
            setReason('');
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
    </form>
  );
}
