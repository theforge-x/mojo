'use client';

import { Button } from '@mojo/shared/ui';
import { LayoutGrid, Rows3 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SessionView } from './session-cards';

/**
 * Segmented list/grid switcher. Writes `?view=` on the current path so every
 * session surface (student home, tutor dashboard, slots, payments) gets the
 * same toggle the tutor directory has.
 */
export function SessionViewToggle({ view }: { view: SessionView }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = pathname || '/';

  function applyView(next: SessionView) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'list') params.delete('view');
    else params.set('view', next);
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <fieldset className="flex items-center gap-1 rounded-lg bg-muted p-1">
      <legend className="sr-only">Change session layout</legend>
      <Button
        type="button"
        variant={view === 'list' ? 'primary' : 'ghost'}
        size="sm"
        aria-pressed={view === 'list'}
        aria-label="List view"
        title="List view — detailed rows"
        onClick={() => applyView('list')}
        className="gap-1.5"
      >
        <Rows3 className="size-4" aria-hidden />
        <span className="hidden sm:inline">List</span>
      </Button>
      <Button
        type="button"
        variant={view === 'grid' ? 'primary' : 'ghost'}
        size="sm"
        aria-pressed={view === 'grid'}
        aria-label="Grid view"
        title="Masonry grid view"
        onClick={() => applyView('grid')}
        className="gap-1.5"
      >
        <LayoutGrid className="size-4" aria-hidden />
        <span className="hidden sm:inline">Grid</span>
      </Button>
    </fieldset>
  );
}
