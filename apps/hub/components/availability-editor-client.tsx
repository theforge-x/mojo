'use client';

import type { AvailabilityRule } from '@mojo/scheduling/domain';
import { AvailabilityEditor } from '@mojo/scheduling/feature';

/**
 * Client-side boundary for the availability editor. Server Components cannot
 * pass an `onSave` function across the RSC edge, so the persistence (a plain
 * fetch to the API route) is assembled here instead of in the page.
 */
export interface AvailabilityEditorClientProps {
  initialRules: AvailabilityRule[];
}

export function AvailabilityEditorClient({ initialRules }: AvailabilityEditorClientProps) {
  return (
    <AvailabilityEditor
      initialRules={initialRules}
      onSave={async (updated) => {
        const response = await fetch('/api/availability', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rules: updated }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? 'Could not save availability.');
        }
      }}
    />
  );
}
