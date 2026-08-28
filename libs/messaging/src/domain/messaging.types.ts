export interface Message {
  readonly id: string;
  readonly senderId: string;
  readonly recipientId: string;
  readonly body: string;
  readonly sentAt: string;
  readonly readAt: string | null;
}
