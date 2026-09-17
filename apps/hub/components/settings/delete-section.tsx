'use client';

import { Alert, Button, Field, FieldLabel, Input } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteSection() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function destroy() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Could not delete account.');
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account.');
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <div className="space-y-3">
        <p className="max-w-prose text-sm text-muted-foreground">
          Deleting your account signs you out everywhere and deactivates it immediately — you
          won&apos;t be able to book, teach, or sign back in. Lesson history is kept for audit and
          refund integrity.
        </p>
        <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
          Delete account…
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void destroy();
      }}
      className="flex max-w-md flex-col gap-3"
    >
      <p className="text-sm font-medium text-headline">
        This is permanent. Confirm with your password to delete your account.
      </p>
      <Field>
        <FieldLabel htmlFor="settings-delete-password">Current password</FieldLabel>
        <Input
          id="settings-delete-password"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={busy || !currentPassword}>
          {busy ? 'Deleting…' : 'Yes, delete my account'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => {
            setConfirming(false);
            setCurrentPassword('');
            setError(null);
          }}
        >
          Keep my account
        </Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
    </form>
  );
}
