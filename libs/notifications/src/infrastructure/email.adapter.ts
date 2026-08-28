import type { NotificationDispatcher } from '../domain/notifications.types';

export class EmailDispatcher implements Pick<NotificationDispatcher, 'send'> {
  constructor(private readonly apiKey: string) {}

  async send(
    _channel: 'email',
    to: string,
    templateId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    // Provider-agnostic shape deliberately — swap the fetch target for
    // Resend/Postmark/SES without touching any module that calls `send`.
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, template: templateId, data, from: 'Mojo <hello@mojo.app>' }),
    });
    if (!response.ok) throw new Error(`Email send failed with status ${response.status}`);
  }
}
