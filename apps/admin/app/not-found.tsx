import { Button } from '@mojo/shared/ui';
import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-12 text-center">
      <h1 className="font-display text-xl font-bold text-headline">Page not found</h1>
      <p className="text-sm text-muted-foreground">This console page doesn&apos;t exist.</p>
      <Link href="/nexus">
        <Button>Back to nexus</Button>
      </Link>
    </main>
  );
}
