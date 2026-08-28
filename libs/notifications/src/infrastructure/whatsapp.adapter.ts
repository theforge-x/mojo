import type { NotificationDispatcher } from '../domain/notifications.types';

const WHATSAPP_API_BASE = 'https://graph.facebook.com/v21.0';

/**
 * WhatsApp Business Cloud API — the channel the roadmap treats as
 * first-class alongside email for the Nigerian market, given its far
 * better open rates and independence from a stable data connection.
 */
export class WhatsAppDispatcher implements Pick<NotificationDispatcher, 'send'> {
  constructor(
    private readonly phoneNumberId: string,
    private readonly accessToken: string,
  ) {}

  async send(_channel: 'whatsapp', to: string, templateId: string, data: Record<string, unknown>): Promise<void> {
    const response = await fetch(`${WHATSAPP_API_BASE}/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: templateId, language: { code: 'en' }, components: toComponents(data) },
      }),
    });
    if (!response.ok) throw new Error(`WhatsApp send failed with status ${response.status}`);
  }
}

function toComponents(data: Record<string, unknown>) {
  return [{ type: 'body', parameters: Object.values(data).map((value) => ({ type: 'text', text: String(value) })) }];
}
