'use client';

import { Button, Card, CardContent } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Opens a group lab inside the tutor's availability — seats fill the ladder. */
export function GroupLabCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [maxSeats, setMaxSeats] = useState('20');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-2 text-sm font-bold text-headline">Open a group lab</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Title
            <input
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-headline"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Saturday Physics Lab"
              maxLength={80}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Seats (2–100)
            <input
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-headline"
              type="number"
              min={2}
              max={100}
              value={maxSeats}
              onChange={(event) => setMaxSeats(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Starts
            <input
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-headline"
              type="datetime-local"
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Ends
            <input
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-headline"
              type="datetime-local"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
            />
          </label>
        </div>
        {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}
        <Button
          size="sm"
          className="mt-3"
          disabled={busy || !title.trim() || !start || !end}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              const response = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                  title: title.trim(),
                  startIso: new Date(start).toISOString(),
                  endIso: new Date(end).toISOString(),
                  maxSeats: Number(maxSeats),
                }),
              });
              const body = await response.json().catch(() => ({}));
              if (!response.ok) throw new Error(body.error ?? 'Could not open the lab.');
              setTitle('');
              setStart('');
              setEnd('');
              router.refresh();
            } catch (createError) {
              setError(
                createError instanceof Error ? createError.message : 'Could not open the lab.',
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Opening…' : 'Open lab'}
        </Button>
      </CardContent>
    </Card>
  );
}
