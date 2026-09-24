'use client';

import { Button } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function RefundChargeButton({ chargeId }: { chargeId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/charges/${chargeId}/refund`, { method: 'POST' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Refund failed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refund failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-1">
      <Button size="sm" variant="outline" onClick={handleClick} disabled={busy}>
        {busy ? 'Refunding…' : 'Refund'}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
