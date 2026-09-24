'use client';

import { Button } from '@mojo/shared/ui';

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-12 text-center">
      <h1 className="font-display text-xl font-bold text-headline">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        The console hit an unexpected error. Try again — no changes were lost.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
