import { LiveKitLabProvider } from '@mojo/lab/infrastructure';
import { Badge } from '@mojo/shared/ui';
import { redirect } from 'next/navigation';
import { LabRoomClient } from '../../../../components/lab-room-client';
import { getHub } from '../../../../demo/composition-root';
import { currentUser } from '../../../../lib/session';

/**
 * Student side of the same LiveKit room — access tokens are minted server-side
 * per request and scoped to the student participant, never cached client-side.
 */
export default async function StudentLabPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'student') redirect('/tutor');

  const hub = getHub();
  const mine = await hub.scheduling.sessionsByStudent(user.id);
  if (!mine.some((s) => s.id === sessionId)) redirect('/');

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
      <LabRoomClient sessionId={sessionId} access={access} homePath="/" />
    </main>
  );
}
