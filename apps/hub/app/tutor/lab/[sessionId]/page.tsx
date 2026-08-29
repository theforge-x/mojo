import { LabRoom } from '@mojo/lab/feature';
import { LiveKitLabProvider } from '@mojo/lab/infrastructure';
import { Badge } from '@mojo/shared/ui';
import { redirect } from 'next/navigation';
import { getHub } from '../../../../demo/composition-root';
import { fileStorage } from '../../../../lib/lab';
import { currentUser } from '../../../../lib/session';

/**
 * Server Component fetches a fresh LiveKit access token per page load —
 * tokens are short-lived (see TOKEN_TTL_SECONDS in the adapter) and scoped
 * to a single participant, so they're never cached or reused client-side.
 */
export default async function TutorLabPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  const user = await currentUser();
  if (!user || user.role !== 'tutor') redirect('/login');

  const hub = getHub();
  const mine = await hub.scheduling.sessionsByTutor(user.id);
  if (!mine.some((s) => s.id === sessionId)) redirect('/tutor/home');

  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return (
      <main className="flex h-screen items-center justify-center p-8">
        <div className="max-w-md space-y-4 rounded-lg border border-border bg-background p-8 text-center">
          <Badge variant="primary">Lab</Badge>
          <h1 className="font-display text-lg font-bold text-headline">
            LiveKit is not configured
          </h1>
          <p className="text-sm text-muted-foreground">
            Set <code className="rounded bg-muted px-1 py-0.5">LIVEKIT_API_KEY</code>,{' '}
            <code className="rounded bg-muted px-1 py-0.5">LIVEKIT_API_SECRET</code> and{' '}
            <code className="rounded bg-muted px-1 py-0.5">LIVEKIT_URL</code> to open the session
            lab.
          </p>
        </div>
      </main>
    );
  }

  const provider = new LiveKitLabProvider(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL);
  const access = await provider.createAccess({
    sessionId,
    participantId: user.id,
    participantName: user.email,
  });

  return (
    <main className="h-screen p-4">
      <LabRoom
        sessionId={sessionId}
        access={access}
        fileStorage={fileStorage()}
        onDisconnected={() => redirect('/tutor/home')}
      />
    </main>
  );
}
