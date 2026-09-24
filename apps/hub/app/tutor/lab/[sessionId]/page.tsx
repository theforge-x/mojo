import { LiveKitLabProvider } from '@mojo/lab/infrastructure';
import { redirect } from 'next/navigation';
import { LabNotConfigured } from '../../../../components/lab-not-configured';
import { LabRoomClient } from '../../../../components/lab-room-client';
import { getHub } from '../../../../demo/composition-root';
import { currentUser } from '../../../../lib/session';

/**
 * Server Component fetches a fresh LiveKit access token per page load —
 * tokens are short-lived (see TOKEN_TTL_SECONDS in the adapter) and scoped
 * to a single participant, so they're never cached or reused client-side.
 */
export default async function TutorLabPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  const user = await currentUser();
  if (user?.role !== 'tutor') redirect('/login');

  const hub = getHub();
  const mine = await hub.scheduling.sessionsByTutor(user.id);
  const session = mine.find((s) => s.id === sessionId);
  if (!session) redirect('/tutor');

  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return <LabNotConfigured />;
  }

  const provider = new LiveKitLabProvider(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL);
  const access = await provider.createAccess({
    sessionId,
    participantId: user.id,
    participantName: user.email,
    // Group seats share one room keyed by the lab, not per-seat rooms.
    roomKey: session.groupId ?? undefined,
  });

  return (
    <main className="h-screen p-4">
      <LabRoomClient sessionId={sessionId} access={access} homePath="/tutor" />
    </main>
  );
}
