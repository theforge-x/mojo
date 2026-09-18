import { LiveKitLabProvider } from '@mojo/lab/infrastructure';
import { redirect } from 'next/navigation';
import { LabNotConfigured } from '../../../../../components/lab-not-configured';
import { LabRoomClient } from '../../../../../components/lab-room-client';
import { getHub } from '../../../../../demo/composition-root';
import { currentUser } from '../../../../../lib/session';

/**
 * The tutor's door into a group lab. Tutors hold no seat row of their own,
 * so ownership of the lab itself gates access — every seat joins the same
 * `mojo-lab-<group>` room via its own session page.
 */
export default async function TutorGroupLabPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const user = await currentUser();
  if (user?.role !== 'tutor') redirect('/login');

  const hub = getHub();
  const lab = await hub.groups.lab(groupId);
  if (!lab || lab.tutorId !== user.id) redirect('/tutor');

  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return <LabNotConfigured />;
  }

  const provider = new LiveKitLabProvider(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL);
  const access = await provider.createAccess({
    sessionId: groupId,
    participantId: user.id,
    participantName: user.email,
    roomKey: groupId,
  });

  return (
    <main className="h-screen p-4">
      <LabRoomClient sessionId={groupId} access={access} homePath="/tutor" />
    </main>
  );
}
