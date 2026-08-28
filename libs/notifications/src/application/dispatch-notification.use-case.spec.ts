import { describe, expect, it, vi } from 'vitest';
import type { NotificationChannel, NotificationDispatcher } from '../domain/notifications.types';
import { makeDispatchNotification, UnsupportedChannelError } from './dispatch-notification.use-case';

function makeSpyDispatcher(channel: NotificationChannel) {
  const send = vi.fn<NotificationDispatcher['send']>(async () => {});
  return { dispatcher: { send } as NotificationDispatcher, send };
}

describe('dispatchNotification', () => {
  it('routes to the dispatcher registered for the channel', async () => {
    const email = makeSpyDispatcher('email');
    const dispatchNotification = makeDispatchNotification({ dispatchers: { email: email.dispatcher } });
    await dispatchNotification({
      channel: 'email',
      to: 'a@b.com',
      templateId: 'welcome',
      data: { name: 'Ada' },
    });
    expect(email.send).toHaveBeenCalledWith('email', 'a@b.com', 'welcome', { name: 'Ada' });
  });

  it('throws when no dispatcher is registered for the channel', async () => {
    const dispatchNotification = makeDispatchNotification({ dispatchers: {} });
    await expect(
      dispatchNotification({
        channel: 'whatsapp',
        to: '+2348000000000',
        templateId: 'welcome_wa',
        data: {},
      }),
    ).rejects.toThrow(UnsupportedChannelError);
  });

  it('propagates a provider failure', async () => {
    const failing = {
      send: async () => {
        throw new Error('provider down');
      },
    };
    const dispatchNotification = makeDispatchNotification({ dispatchers: { email: failing } });
    await expect(
      dispatchNotification({
        channel: 'email',
        to: 'a@b.com',
        templateId: 'welcome',
        data: {},
      }),
    ).rejects.toThrow('provider down');
  });
});
