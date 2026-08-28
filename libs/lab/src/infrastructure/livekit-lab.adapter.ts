import { AccessToken, type VideoGrant } from 'livekit-server-sdk';
import type { LabAccess, LabProvider } from '../domain/lab.types';

const TOKEN_TTL_SECONDS = 3 * 60 * 60; // a lesson plus buffer, not LiveKit's 6h default

/**
 * The one file in the whole codebase allowed to import livekit-server-sdk —
 * every other module reaches the lab only through LabProvider.
 * Room name is the session id directly: a session and its room are the same
 * concept, so there's no separate mapping table to keep in sync.
 */
export class LiveKitLabProvider implements LabProvider {
  constructor(
    private readonly apiKey: string,
    private readonly apiSecret: string,
    private readonly serverUrl: string,
  ) {}

  async createAccess(input: {
    sessionId: string;
    participantId: string;
    participantName: string;
  }): Promise<LabAccess> {
    const roomName = `mojo-session-${input.sessionId}`;

    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: input.participantId,
      name: input.participantName,
      ttl: TOKEN_TTL_SECONDS,
    });

    const grant: VideoGrant = { room: roomName, roomJoin: true, canPublish: true, canSubscribe: true };
    at.addGrant(grant);

    const participantToken = await at.toJwt();

    return {
      roomName,
      serverUrl: this.serverUrl,
      participantToken,
      expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString(),
    };
  }
}
