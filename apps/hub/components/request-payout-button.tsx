'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Alert } from '@mojo/shared/ui';

export function RequestPayoutButton({ balanceMinor, currency }: { balanceMinor: number; currency: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountMinor: balanceMinor, currency }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Payout failed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payout failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleClick} disabled={busy}>
        {busy ? 'Processing…' : 'Request payout'}
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
    </>
  );
}