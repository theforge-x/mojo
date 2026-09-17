'use client';

import { Alert, Button, Textarea } from '@mojo/shared/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Decision = 'approved' | 'rejected' | 'in_review';

export function ReviewButtons({
  applicationId,
  status,
}: {
  applicationId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  async function review(decision: Decision, reason?: string) {
    setBusy(decision);
    setError(null);
    try {
      const response = await fetch(`/api/applications/${applicationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note: reason }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Review failed.');
      setRejecting(false);
      setNote('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review failed.');
    } finally {
      setBusy(null);
    }
  }

  const disabled = busy !== null;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {status === 'pending' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void review('in_review')}
            disabled={disabled}
          >
            {busy === 'in_review' ? 'Starting…' : 'Start review'}
          </Button>
        )}
        <Button size="sm" onClick={() => void review('approved')} disabled={disabled}>
          {busy === 'approved' ? 'Approving…' : 'Approve'}
        </Button>
        {!rejecting && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRejecting(true)}
            disabled={disabled}
          >
            Reject
          </Button>
        )}
      </div>
      {rejecting && (
        <form
          className="flex w-full min-w-64 flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void review('rejected', note);
          }}
        >
          <Textarea
            aria-label="Rejection reason"
            placeholder="Why is this being rejected? The applicant sees this."
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            required
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={disabled || !note.trim()}
            >
              {busy === 'rejected' ? 'Rejecting…' : 'Confirm reject'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => {
                setRejecting(false);
                setNote('');
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
    </div>
  );
}
