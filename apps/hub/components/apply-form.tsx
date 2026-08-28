'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Input, Textarea } from '@mojo/shared/ui';

export function ApplyForm() {
  const router = useRouter();
  const [subjects, setSubjects] = useState('');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: subjects.split(',').map((s) => s.trim()).filter(Boolean),
          bio,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not submit application.');
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <Alert>Application submitted — a tutor-applications review will get back to you.</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="flex flex-col gap-1">
        <label htmlFor="subjects" className="text-sm font-medium text-headline">
          Subjects
        </label>
        <Input id="subjects" placeholder="Spanish, Guitar, Maths" value={subjects} onChange={(e) => setSubjects(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="bio" className="text-sm font-medium text-headline">
          Tell us about yourself
        </label>
        <Textarea id="bio" placeholder="How long have you taught? What&apos;s your style?" value={bio} onChange={(e) => setBio(e.target.value)} required />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? 'Submitting…' : 'Submit application'}
      </Button>
    </form>
  );
}