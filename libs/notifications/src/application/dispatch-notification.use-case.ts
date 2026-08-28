import type { NotificationChannel, NotificationDispatcher } from '../domain/notifications.types';

export interface Notification {
  readonly channel: NotificationChannel;
  readonly to: string;
  readonly templateId: string;
  readonly data: Record<string, unknown>;
}

export class UnsupportedChannelError extends Error {
  constructor(channel: NotificationChannel) {
    super(`No dispatcher is registered for the ${channel} channel.`);
  }
}

export function makeDispatchNotification(deps: {
  dispatchers: Partial<Record<NotificationChannel, NotificationDispatcher>>;
}) {
  return async function dispatchNotification(notification: Notification): Promise<void> {
    const dispatcher = deps.dispatchers[notification.channel];
    if (!dispatcher) throw new UnsupportedChannelError(notification.channel);
    await dispatcher.send(notification.channel, notification.to, notification.templateId, notification.data);
  };
}
