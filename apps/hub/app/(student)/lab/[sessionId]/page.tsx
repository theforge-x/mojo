import { LiveKitLabProvider } from '@mojo/lab/infrastructure';
import { redirect } from 'next/navigation';
import { LabNotConfigured } from '../../../../components/lab-not-configured';
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
  const session = mine.find((s) => s.id === sessionId);
  if (!session) redirect('/');

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
      <LabRoomClient sessionId={sessionId} access={access} homePath="/" />
    </main>
  );
}
