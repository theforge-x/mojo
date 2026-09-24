export interface MojoPlusSubscription {
  readonly tutorId: string;
  readonly status: 'active' | 'cancelled';
  readonly customSegmentRateMinor: number | null;
  readonly subscribedAt: string;
  readonly cancelledAt: string | null;
}

// Re-exported here so existing `.../domain` imports keep working; new code
// should import the port from `./mojo-plus.ports`.
export type { MojoPlusRepository } from './mojo-plus.ports';
