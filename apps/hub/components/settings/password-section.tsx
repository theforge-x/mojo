'use client';

import { Alert, Button, Field, FieldLabel, Input } from '@mojo/shared/ui';
import { useState } from 'react';

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const response = await fetch('/api/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Could not change password.');
      setSaved(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password.');
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
      <Field>
        <FieldLabel htmlFor="settings-current-password">Current password</FieldLabel>
        <Input
          id="settings-current-password"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="settings-new-password">New password</FieldLabel>
        <Input
          id="settings-new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">
          At least 10 characters, with an uppercase letter and a digit.
        </p>
      </Field>
      <div>
        <Button type="submit" size="sm" disabled={busy || !currentPassword || !newPassword}>
          {busy ? 'Updating…' : 'Update password'}
        </Button>
      </div>
      {saved && <Alert>Password updated.</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
    </form>
  );
}
