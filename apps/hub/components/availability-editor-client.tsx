'use client';

import type { AvailabilityRule } from '@mojo/scheduling/domain';
import { AvailabilityEditor, type WeeklyWindow } from '@mojo/scheduling/feature';
import { Card, CardContent, CardHeader, CardTitle } from '@mojo/shared/ui';
import { useState } from 'react';

/**
 * Client-side boundary for the availability editor. Server Components cannot
 * pass an `onChange`/`onSave` combo across the RSC edge, so the persistence
 * (a plain fetch to the API route) is assembled here instead of in the page.
 */
export interface AvailabilityEditorClientProps {
  initialRules: AvailabilityRule[];
}

export function AvailabilityEditorClient({ initialRules }: AvailabilityEditorClientProps) {
  const [rules, setRules] = useState<WeeklyWindow[]>(initialRules);
  const [saving, setSaving] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly availability</CardTitle>
      </CardHeader>
      <CardContent>
        <AvailabilityEditor
          rules={rules}
          onChange={setRules}
          saving={saving}
          onSave={async (updated) => {
            setSaving(true);
            try {
              const response = await fetch('/api/availability', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rules: updated }),
              });
              if (!response.ok) {
                const body = await response.json().catch(() => null);
                throw new Error(body?.error ?? 'Could not save availability.');
              }
            } finally {
              setSaving(false);
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
