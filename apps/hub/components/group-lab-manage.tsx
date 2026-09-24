'use client';

import { Alert, Button, Card, CardContent } from '@mojo/shared/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface GroupLabRow {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  maxSeats: number;
  status: 'open' | 'locked' | 'cancelled';
  lockedSize: number | null;
  seatsTaken: number;
}

/**
 * The tutor's group-lab console: open a lab, then lock it (freezing the
 * ladder size and refunding overpaid seats) or cancel it (full refunds).
 * Rows refresh from the server after every action so seat counts never lie.
 */
export function GroupLabManage({ initialLabs }: { initialLabs: GroupLabRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(labId: string, action: 'lock' | 'cancel') {
    setBusyId(labId);
    setResult(null);
    setError(null);
    try {
      const response = await fetch(`/api/groups/${labId}/${action}`, { method: 'POST' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? `Could not ${action} the lab.`);
      if (action === 'lock') {
        const count = (body.adjustments ?? []).length as number;
        setResult(
          `Locked at ${body.group.lockedSize} seats.` +
            (count > 0 ? ` ${count} seat${count === 1 ? '' : 's'} refunded to the locked price.` : ' No refunds needed.'),
        );
      } else {
        setResult(`Cancelled — ${(body.unwoundSessionIds ?? []).length} seats refunded in full.`);
      }
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Could not ${action} the lab.`);
    } finally {
      setBusyId(null);
    }
  }

  if (initialLabs.length === 0) {
    return <p className="text-sm text-muted-foreground">No group labs yet — open one below.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {result && <Alert variant="info">{result}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      {initialLabs.map((lab) => (
        <Card key={lab.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="font-medium text-headline">{lab.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(lab.startIso).toLocaleString()} · {lab.seatsTaken}/{lab.maxSeats} seats ·
                {lab.status === 'locked' ? ` locked at ${lab.lockedSize}` : ` ${lab.status}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(lab.status === 'open' || lab.status === 'locked') && (
                <Link href={`/tutor/lab/group/${lab.id}`}>
                  <Button size="sm" variant="outline">
                    Open lab room
                  </Button>
                </Link>
              )}
              {lab.status === 'open' && (
                <>
                  <Button
                    size="sm"
                    disabled={busyId === lab.id || lab.seatsTaken < 2}
                    title={lab.seatsTaken < 2 ? 'Needs at least 2 enrolled students' : undefined}
                    onClick={() => act(lab.id, 'lock')}
                  >
                    {busyId === lab.id ? 'Working…' : 'Lock & settle'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === lab.id}
                    onClick={() => act(lab.id, 'cancel')}
                  >
                    Cancel lab
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
