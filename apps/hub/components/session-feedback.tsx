'use client';

import { Alert, Button, Label, Textarea } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const RATINGS = ['5', '4', '3', '2', '1'];

export function ReviewForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState('5');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, rating: Number(rating), body }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'Could not submit review.');
      setBody('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={`rating-${sessionId}`}>Rating</Label>
        <select
          id={`rating-${sessionId}`}
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
        >
          {RATINGS.map((r) => (
            <option key={r} value={r}>
              {r}★
            </option>
          ))}
        </select>
      </div>
      <Textarea
        aria-label="Review"
        placeholder="What went well? What could be better?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
      />
      {error && <Alert variant="danger">{error}</Alert>}
      <Button type="submit" size="sm" disabled={busy || body.trim().length === 0}>
        {busy ? 'Submitting…' : 'Submit review'}
      </Button>
    </form>
  );
}

export function NoShowButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/no-show`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'Could not record no-show.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record no-show.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={handleClick} disabled={busy}>
        {busy ? 'Recording…' : 'Mark no-show'}
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
    </div>
  );
}

export function RescheduleForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/reschedule`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          startIso: new Date(start).toISOString(),
          endIso: new Date(end).toISOString(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'Reschedule failed.');
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reschedule failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Reschedule
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor={`rs-start-${sessionId}`}>New start</Label>
        <input
          id={`rs-start-${sessionId}`}
          type="datetime-local"
          required
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`rs-end-${sessionId}`}>New end</Label>
        <input
          id={`rs-end-${sessionId}`}
          type="datetime-local"
          required
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
        />
      </div>
      <Button type="submit" size="sm" disabled={busy || !start || !end}>
        {busy ? 'Moving…' : 'Confirm move'}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
    </form>
  );
}

export function RecapCard({ summary, focusAreas }: { summary: string; focusAreas: readonly string[] }) {
  return (
    <div className="mt-2 w-full rounded-md border border-border bg-muted/40 p-3 text-sm">
      <p className="font-medium">Session recap</p>
      <p className="mt-1 text-muted-foreground">{summary}</p>
      {focusAreas.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Focus areas: {focusAreas.join(', ')}
        </p>
      )}
    </div>
  );
}
