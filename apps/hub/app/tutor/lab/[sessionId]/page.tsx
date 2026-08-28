import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LabRoom } from '@mojo/lab/feature';
import { LiveKitLabProvider, SupabaseFileStorageProvider } from '@mojo/lab/infrastructure';
import type { FileStorageProvider } from '@mojo/lab/domain';
import { Badge } from '@mojo/shared/ui';
import { getHub } from '../../../../demo/composition-root';

/**
 * Server Component fetches a fresh LiveKit access token per page load —
 * tokens are short-lived (see TOKEN_TTL_SECONDS in the adapter) and scoped
 * to a single participant, so they're never cached or reused client-side.
 */
export default async function LabPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  const hub = getHub();
  const store = await cookies();
  const token = store.get('mojo_user')?.value;
  const user = token ? await hub.identity.userById(token) : null;
  const role = store.get('mojo_role')?.value;
  if (role !== 'tutor' || !user) redirect('/login');

  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = process.env;
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
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

function fileStorage(): FileStorageProvider {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    return new SupabaseFileStorageProvider(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  // Demo fallback: files stay in the browser as object URLs (client-only use).
  return {
    async upload(input) {
      const url = URL.createObjectURL(input.file);
      return { url, sizeBytes: input.file.size };
    },
  };
}