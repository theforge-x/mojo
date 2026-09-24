'use client';

import { Alert, Button, Field, FieldLabel, Input } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AccountSection({
  name,
  email,
  role,
  timezone,
}: {
  name: string;
  email: string;
  role: string;
  timezone: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(name);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const response = await fetch('/api/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draft }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Could not save name.');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save name.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Email
          </dt>
          <dd className="mt-1 font-medium text-headline">{email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Role
          </dt>
          <dd className="mt-1 font-medium capitalize text-headline">{role}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Timezone
          </dt>
          <dd className="mt-1 font-medium text-headline">{timezone}</dd>
        </div>
      </dl>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end"
      >
        <Field className="flex-1">
          <FieldLabel htmlFor="settings-display-name">Display name</FieldLabel>
          <Input
            id="settings-display-name"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={60}
            autoComplete="name"
          />
        </Field>
        <Button type="submit" size="sm" disabled={busy || draft.trim() === name.trim()}>
          {busy ? 'Saving…' : 'Save name'}
        </Button>
      </form>
      {saved && <Alert>Name saved.</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
    </div>
  );
}
