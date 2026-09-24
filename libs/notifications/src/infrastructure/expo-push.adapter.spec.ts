import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ExpoPushDispatcher,
  InvalidPushTokenError,
  isExpoPushToken,
} from './expo-push.adapter';

const TOKEN = 'ExponentPushToken[abc123]';

describe('isExpoPushToken', () => {
  it('accepts well-formed Expo tokens', () => {
    expect(isExpoPushToken(TOKEN)).toBe(true);
  });

  it('rejects emails, device ids, and empty strings', () => {
    expect(isExpoPushToken('student@mojo.dev')).toBe(false);
    expect(isExpoPushToken('ExponentPushToken[]')).toBe(false);
    expect(isExpoPushToken('')).toBe(false);
  });
});

describe('ExpoPushDispatcher', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('posts title + data payload to the Expo API', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { status: 'ok' } })));
    vi.stubGlobal('fetch', fetchMock);
    const send = new ExpoPushDispatcher('expo-key');

    await send.send('push', TOKEN, 'lesson-reminder-t-minus-30', { sessionId: 's_1' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('exp.host');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer expo-key');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.to).toBe(TOKEN);
    expect(body.title).toBe('Your Mojo lesson starts in 30 minutes');
    expect(body.data).toEqual({ sessionId: 's_1' });
  });

  it('refuses non-Expo recipients before any network call', async () => {
    const fetchMock = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      new ExpoPushDispatcher('expo-key').send('push', 'student@mojo.dev', 'x', {}),
    ).rejects.toThrow(InvalidPushTokenError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces Expo ticket errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ data: { status: 'error', message: 'bad' } }))),
    );

    await expect(
      new ExpoPushDispatcher('expo-key').send('push', TOKEN, 'x', {}),
    ).rejects.toThrow('Push rejected: bad');
  });
});
