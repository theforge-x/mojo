'use client';

import { Alert, Button, Field, FieldLabel, Input } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function EmailSection({ email }: { email: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState(email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const response = await fetch('/api/me/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: draft, currentPassword }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Could not change email.');
      setSaved(true);
      setCurrentPassword('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="flex max-w-md flex-col gap-3"
    >
      <p className="text-sm text-muted-foreground">
        Current address: <span className="font-medium text-headline">{email}</span>. New lessons and
        receipts go to the new address after you confirm.
      </p>
      <Field>
        <FieldLabel htmlFor="settings-new-email">New email</FieldLabel>
        <Input
          id="settings-new-email"
          type="email"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          autoComplete="email"
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="settings-email-password">Current password</FieldLabel>
        <Input
          id="settings-email-password"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>
      <div>
        <Button type="submit" size="sm" disabled={busy || !draft || !currentPassword}>
          {busy ? 'Updating…' : 'Change email'}
        </Button>
      </div>
      {saved && <Alert>Email updated — use it next time you sign in.</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
    </form>
  );
}
