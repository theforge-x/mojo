export interface Message {
  readonly id: string;
  readonly senderId: string;
  readonly recipientId: string;
  readonly body: string;
  readonly sentAt: string;
  readonly readAt: string | null;
}

export type InterestSource = 'search' | 'view';

export interface TutorInterest {
  readonly id: string;
  readonly studentId: string;
  readonly tutorId: string;
  readonly source: InterestSource;
  readonly createdAt: string;
}
