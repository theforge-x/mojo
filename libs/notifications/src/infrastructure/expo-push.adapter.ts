import type { NotificationDispatcher } from '../domain/notifications.types';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

export class InvalidPushTokenError extends Error {
  constructor(token: string) {
    super(`Not an Expo push token: ${token.slice(0, 24)}…`);
  }
}

export function isExpoPushToken(token: string): boolean {
  return /^ExponentPushToken\[[^\]]+\]$/.test(token);
}

/**
 * Expo push — the mobile channel. `to` is the recipient's Expo push token
 * (registered from the app via `/api/notifications/devices`); the template
 * resolves to the notification title and `data` travels as the payload so
 * the app can deep-link (e.g. a reminder opens the lab room). Follows the
 * same provider-agnostic shape as the email/WhatsApp adapters: swap the
 * fetch target without touching callers.
 */
export class ExpoPushDispatcher implements Pick<NotificationDispatcher, 'send'> {
  constructor(private readonly accessToken: string) {}

  async send(
    _channel: 'push',
    to: string,
    templateId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (!isExpoPushToken(to)) throw new InvalidPushTokenError(to);
    const response = await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, title: templateTitle(templateId), data }),
    });
    if (!response.ok) throw new Error(`Push send failed with status ${response.status}`);
    const receipt = (await response.json().catch(() => ({}))) as {
      data?: { status?: string; message?: string };
    };
    if (receipt.data && receipt.data.status === 'error') {
      throw new Error(`Push rejected: ${receipt.data.message ?? 'unknown error'}`);
    }
  }
}

function templateTitle(templateId: string): string {
  const titles: Record<string, string> = {
    'lesson-reminder-day-before': 'Lesson tomorrow on Mojo',
    'lesson-reminder-t-minus-30': 'Your Mojo lesson starts in 30 minutes',
    'session-booked-confirmation': 'Lesson booked on Mojo',
    'session-cancelled-alert': 'A Mojo lesson was cancelled',
    'session-rescheduled-confirmation': 'A Mojo lesson moved',
    'delivery-confirmed-payout-processing': 'Payout on its way',
  };
  return titles[templateId] ?? 'Mojo';
}
