export type NotificationChannel = 'email' | 'whatsapp' | 'push';

export interface NotificationDispatcher {
  send(
    channel: NotificationChannel,
    to: string,
    templateId: string,
    data: Record<string, unknown>,
  ): Promise<void>;
}

/** One mobile device registered for push — `token` is the Expo push token. */
export interface PushDevice {
  readonly userId: string;
  readonly token: string;
  readonly platform: 'ios' | 'android';
  readonly createdAt: string;
}

export interface PushDeviceRepository {
  save(device: PushDevice): Promise<void>;
  listByUser(userId: string): Promise<PushDevice[]>;
  remove(userId: string, token: string): Promise<void>;
}
