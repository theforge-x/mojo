export type DisputeStatus = 'open' | 'upheld' | 'dismissed';

export interface Dispute {
  readonly id: string;
  readonly sessionId: string;
  readonly filedBy: string;
  readonly reason: string;
  readonly status: DisputeStatus;
  readonly filedAt: string;
  readonly resolvedAt: string | null;
}

export interface Suspension {
  readonly userId: string;
  readonly reason: string;
  readonly suspendedAt: string;
  readonly liftedAt: string | null;
}
