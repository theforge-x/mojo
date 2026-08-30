'use client';

import { Alert, Badge, Button } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function FlagToggle({
  flag,
}: {
  flag: { key: string; enabled: boolean; rolloutPercent: number };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: flag.key,
          enabled: !flag.enabled,
          rolloutPercent: flag.rolloutPercent,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not update flag.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update flag.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={flag.enabled ? 'primary' : 'muted'}>{flag.enabled ? 'on' : 'off'}</Badge>
      <Button size="sm" variant="outline" onClick={handleToggle} disabled={busy}>
        {busy ? '…' : flag.enabled ? 'Disable' : 'Enable'}
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
    </div>
  );
}
