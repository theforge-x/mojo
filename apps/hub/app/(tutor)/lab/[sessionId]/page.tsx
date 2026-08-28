import { LabRoom } from 'libs/lab/src/feature';
import { LiveKitLabProvider } from 'libs/lab/src/infrastructure';

/**
 * Server Component fetches a fresh LiveKit access token per page load —
 * tokens are short-lived (see TOKEN_TTL_SECONDS in the adapter) and scoped
 * to a single participant, so they're never cached or reused client-side.
 */
export default async function LabPage({ params }: { params: { sessionId: string } }) {
  const provider = new LiveKitLabProvider(
    process.env.LIVEKIT_API_KEY as string,
    process.env.LIVEKIT_API_SECRET as string,
    process.env.LIVEKIT_URL as string,
  );

  const access = await provider.createAccess({
    sessionId: params.sessionId,
    participantId: 'current-user-id', // resolved from the session/auth context in a real request
    participantName: 'Ifeoma A.',
  });

  return (
    <main className="h-screen p-4">
      <LabRoom access={access} />
    </main>
  );
}
