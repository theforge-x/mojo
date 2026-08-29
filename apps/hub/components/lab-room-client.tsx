'use client';

import type { LabAccess } from '@mojo/lab/domain';
import { LabRoom } from '@mojo/lab/feature';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { createClientFileStorage } from '../lib/lab';

/**
 * The client-side boundary for the LiveKit lab. Server Components may only
 * pass serializable props across the RSC edge, so routing/navigation and the
 * file-storage adapter (both functions, never serializable) are assembled
 * here instead of in the Server Component pages.
 */
export interface LabRoomClientProps {
  sessionId: string;
  access: LabAccess;
  homePath: string;
}

export function LabRoomClient({ sessionId, access, homePath }: LabRoomClientProps) {
  const router = useRouter();
  const onDisconnected = useCallback(() => router.push(homePath), [router, homePath]);
  const fileStorage = useMemo(() => createClientFileStorage(), []);

  return (
    <LabRoom
      sessionId={sessionId}
      access={access}
      fileStorage={fileStorage}
      onDisconnected={onDisconnected}
    />
  );
}
