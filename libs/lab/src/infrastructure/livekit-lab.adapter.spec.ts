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

    expect(access.roomName).toBe('mojo-session-s_123');
    expect(access.serverUrl).toBe('wss://mojo.livekit.cloud');
    expect(typeof access.participantToken).toBe('string');
    expect(access.participantToken.length).toBeGreaterThan(0);
  });

  it('two different participants for the same session get the same room name', async () => {
    const provider = new LiveKitLabProvider('key', 'secret', 'wss://mojo.livekit.cloud');

    const tutorAccess = await provider.createAccess({ sessionId: 's_123', participantId: 'tutor_1', participantName: 'Tutor' });
    const studentAccess = await provider.createAccess({ sessionId: 's_123', participantId: 'student_1', participantName: 'Student' });

    expect(tutorAccess.roomName).toBe(studentAccess.roomName);
    expect(tutorAccess.participantToken).not.toBe(studentAccess.participantToken);
  });
});
