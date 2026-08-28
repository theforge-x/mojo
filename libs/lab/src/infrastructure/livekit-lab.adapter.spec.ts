import { describe, expect, it } from 'vitest';
import { LiveKitLabProvider } from './livekit-lab.adapter';

describe('LiveKitLabProvider', () => {
  it('derives the room name deterministically from the session id', async () => {
    const provider = new LiveKitLabProvider('key', 'secret', 'wss://mojo.livekit.cloud');

    const access = await provider.createAccess({
      sessionId: 's_123',
      participantId: 'tutor_1',
      participantName: 'Ifeoma A.',
    });

    expect(access.roomName).toBe('mojo-lab-s_123');
    expect(access.serverUrl).toBe('wss://mojo.livekit.cloud');
    expect(access.participantToken.length).toBeGreaterThan(0);
  });

  it('every participant in the same session shares one room, regardless of headcount', async () => {
    const provider = new LiveKitLabProvider('key', 'secret', 'wss://mojo.livekit.cloud');

    const names = ['Tutor', 'Student A', 'Student B', 'Student C'];
    const accesses = await Promise.all(
      names.map((name, i) =>
        provider.createAccess({ sessionId: 's_group', participantId: `p_${i}`, participantName: name }),
      ),
    );

    const roomNames = new Set(accesses.map((a) => a.roomName));
    expect(roomNames.size).toBe(1);
    const tokens = new Set(accesses.map((a) => a.participantToken));
    expect(tokens.size).toBe(accesses.length); // every participant still gets a distinct token
  });
});
