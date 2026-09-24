'use client';

import { Alert, Badge, Button } from '@mojo/shared/ui';
import { CreditCard, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface PaymentMethodView {
  id: string;
  rail: string;
  last4: string;
  isDefault: boolean;
}

export function PaymentMethodsSection() {
  const [methods, setMethods] = useState<PaymentMethodView[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/payment-methods');
    if (!response.ok) {
      setError('Could not load payment methods.');
      return;
    }
    const body = (await response.json()) as { methods: PaymentMethodView[] };
    setMethods(body.methods);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addCard() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/payment-methods', { method: 'POST' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? 'Could not add card.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add card.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {methods === null && !error && (
        <p className="text-sm text-muted-foreground">Loading saved cards…</p>
      )}
      {methods !== null && methods.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No cards yet — bookings need a card on file. Add the demo card to try checkout.
        </p>
      )}
      {methods !== null && methods.length > 0 && (
        <ul className="space-y-2">
          {methods.map((method) => (
            <li
              key={method.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
            >
              <CreditCard className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="text-sm font-medium capitalize text-headline">{method.rail}</span>
              <span className="font-mono text-sm text-muted-foreground">····{method.last4}</span>
              {method.isDefault && <Badge variant="primary">Default</Badge>}
            </li>
          ))}
        </ul>
      )}
      <Button size="sm" variant="outline" onClick={addCard} disabled={busy}>
        <Plus className="size-4" aria-hidden />
        {busy ? 'Adding…' : 'Add demo card'}
      </Button>
      {error && <Alert variant="danger">{error}</Alert>}
    </div>
  );
}
