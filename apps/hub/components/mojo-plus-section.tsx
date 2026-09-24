'use client';

import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@mojo/shared/ui';
import { Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatMinor } from '../lib/format';

export interface MojoPlusTransaction {
  readonly id: string;
  readonly kind: string;
  readonly amountMinor: number;
  readonly relatedSessionId: string | null;
  readonly createdAt: string;
}

export function MojoPlusSection({
  status,
  customRateMinor,
  defaultRateMinor,
  transactions,
}: {
  status: 'active' | 'cancelled' | null;
  customRateMinor: number | null;
  defaultRateMinor: number;
  transactions: readonly MojoPlusTransaction[];
}) {
  const router = useRouter();
  const [rateDraft, setRateDraft] = useState(customRateMinor ? String(customRateMinor / 100) : '');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function mutate(action: string, rateMinor?: number) {
    setBusy(action);
    setError(null);
    try {
      const response = await fetch('/api/mojo-plus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rateMinor }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Mojo+ update failed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mojo+ update failed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="size-4 text-primary" aria-hidden />
            Mojo+
            {status === 'active' ? (
              <Badge variant="primary">active</Badge>
            ) : (
              <Badge variant="muted">off</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Set your own per-lesson rate instead of the level rate ({formatMinor(defaultRateMinor)}{' '}
            now
            {customRateMinor ? `, yours ${formatMinor(customRateMinor)}` : ''}).
          </p>
          {status === 'active' ? (
            <>
              <form
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  const rateMinor = Math.round(Number(rateDraft) * 100);
                  if (Number.isFinite(rateMinor)) void mutate('set-rate', rateMinor);
                }}
              >
                <div className="flex flex-1 flex-col gap-1">
                  <label
                    htmlFor="mojo-custom-rate"
                    className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    Custom rate (₦ per segment)
                  </label>
                  <Input
                    id="mojo-custom-rate"
                    value={rateDraft}
                    onChange={(event) => setRateDraft(event.target.value)}
                    inputMode="decimal"
                    placeholder="e.g. 6500"
                  />
                </div>
                <Button type="submit" size="sm" disabled={busy !== null || !rateDraft}>
                  {busy === 'set-rate' ? 'Saving…' : 'Save rate'}
                </Button>
              </form>
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => void mutate('cancel')}
              >
                {busy === 'cancel' ? 'Cancelling…' : 'Cancel Mojo+'}
              </Button>
            </>
          ) : (
            <Button size="sm" disabled={busy !== null} onClick={() => void mutate('subscribe')}>
              {busy === 'subscribe' ? 'Activating…' : 'Activate Mojo+'}
            </Button>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout history</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing yet — completed lessons credit your wallet here.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {transactions.slice(0, 10).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="min-w-0 truncate text-muted-foreground">
                    <span className="font-medium capitalize text-headline">{t.kind}</span> ·{' '}
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                  <span className="shrink-0 font-medium text-headline">
                    {formatMinor(t.amountMinor)}
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
