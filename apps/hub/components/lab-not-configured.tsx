import { Badge } from '@mojo/shared/ui';

export function LabNotConfigured() {
  return (
    <main className="flex h-screen items-center justify-center p-8">
      <div className="max-w-md space-y-4 rounded-lg border border-border bg-background p-8 text-center">
        <Badge variant="primary">Lab</Badge>
        <h1 className="font-display text-lg font-bold text-headline">LiveKit is not configured</h1>
        <p className="text-sm text-muted-foreground">
          Set <code className="rounded bg-muted px-1 py-0.5">LIVEKIT_API_KEY</code>,{' '}
          <code className="rounded bg-muted px-1 py-0.5">LIVEKIT_API_SECRET</code> and{' '}
          <code className="rounded bg-muted px-1 py-0.5">LIVEKIT_URL</code> to open the session lab.
        </p>
      </div>
    </main>
  );
}
