export interface Review {
  readonly id: string;
  readonly sessionId: string;
  readonly tutorId: string;
  readonly studentId: string;
  readonly rating: number; // 1..5
  readonly body: string;
  readonly flagged: boolean;
  readonly createdAt: string;
}
