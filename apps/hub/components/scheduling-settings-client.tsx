'use client';

import type { SchedulingSettings } from '@mojo/scheduling/domain';
import { Alert, Button, Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import { useState } from 'react';
import { formatWhen } from '../lib/format';

interface SchedulingSettingsClientProps {
  initialSettings: SchedulingSettings;
  sessions: { id: string; startIso: string; endIso: string; status: string }[];
}

export function SchedulingSettingsClient({
  initialSettings,
  sessions,
}: SchedulingSettingsClientProps) {
  const [bufferMinutes, setBufferMinutes] = useState(initialSettings.bufferMinutes);
  const [minimumNoticeMinutes, setMinimumNoticeMinutes] = useState(
    initialSettings.minimumNoticeMinutes,
  );
  const [paused, setPaused] = useState(initialSettings.pausedForNewBookings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/availability/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bufferMinutes,
          minimumNoticeMinutes,
          pausedForNewBookings: paused,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Could not save scheduling settings.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save scheduling settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Scheduling settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Buffer between sessions (minutes)
            <input
              type="number"
              min={0}
              max={120}
              value={bufferMinutes}
              onChange={(event) => setBufferMinutes(Number(event.target.value))}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
            <span className="text-xs text-muted-foreground">
              A slot that lands within {bufferMinutes} minutes of an existing booking is hidden.
            </span>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Minimum notice (minutes)
            <input
              type="number"
              min={0}
              max={1440}
              value={minimumNoticeMinutes}
              onChange={(event) => setMinimumNoticeMinutes(Number(event.target.value))}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={paused}
              onChange={(event) => setPaused(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Pause new bookings
          </label>
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving} size="sm">
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
            {error && <Alert>{error}</Alert>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This week — buffer around booked sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sessions booked yet. Once a session lands, its ±{bufferMinutes}-minute buffer is
              shown as unavailable on the student&apos;s slot list.
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions.slice(0, 20).map((session) => (
                <li key={session.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <span className="font-medium text-headline">
                    {formatWhen(session.startIso, session.endIso)}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Buffer: {formatMinutes(session.startIso, -bufferMinutes)} –{' '}
                    {formatMinutes(session.endIso, bufferMinutes)} blocked on both sides.
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatMinutes(iso: string, offsetMinutes: number): string {
  const d = new Date(new Date(iso).getTime() + offsetMinutes * 60_000);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
