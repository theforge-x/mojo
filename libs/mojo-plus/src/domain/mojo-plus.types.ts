export interface MojoPlusSubscription {
  readonly tutorId: string;
  readonly status: 'active' | 'cancelled';
  readonly customSegmentRateMinor: number | null;
  readonly subscribedAt: string;
  readonly cancelledAt: string | null;
}

export interface MojoPlusRepository {
  find(tutorId: string): Promise<MojoPlusSubscription | null>;
  save(subscription: MojoPlusSubscription): Promise<void>;
}
