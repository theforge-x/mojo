'use client';

import { Alert, Button } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ReviewButtons({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(decision: 'approve' | 'reject') {
    setBusy(decision);
    setError(null);
    try {
      const response = await fetch(`/api/applications/${applicationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Review failed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed.');
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
          onClick={() => review('reject')}
          disabled={busy !== null}
        >
          {busy === 'reject' ? 'Rejecting…' : 'Reject'}
        </Button>
        <Button size="sm" onClick={() => review('approve')} disabled={busy !== null}>
          {busy === 'approve' ? 'Approving…' : 'Approve'}
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
    </>
  );
}
