import { Button } from '@mojo/shared/ui';
import Link from 'next/link';

export default function HubNotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-12 text-center">
      <h1 className="font-display text-xl font-bold text-headline">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        This page doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link href="/">
        <Button>Back home</Button>
      </Link>
    </main>
  );
}
