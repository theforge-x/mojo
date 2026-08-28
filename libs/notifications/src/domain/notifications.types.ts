export type NotificationChannel = 'email' | 'whatsapp';

export interface NotificationDispatcher {
  send(
    channel: NotificationChannel,
    to: string,
    templateId: string,
    data: Record<string, unknown>,
  ): Promise<void>;
}
