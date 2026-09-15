'use client';

import { Alert, Button } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ResolveDisputeButtons({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'upheld' | 'dismissed' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(outcome: 'upheld' | 'dismissed') {
    setBusy(outcome);
    setError(null);
    try {
      const response = await fetch(`/api/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Resolve failed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resolve failed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => resolve('dismissed')}
          disabled={busy !== null}
        >
          {busy === 'dismissed' ? 'Dismissing…' : 'Dismiss'}
        </Button>
        <Button size="sm" onClick={() => resolve('upheld')} disabled={busy !== null}>
          {busy === 'upheld' ? 'Upholding…' : 'Uphold'}
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
    </>
  );
}
