export interface ReferralLink {
  readonly code: string;
  readonly ownerId: string;
  readonly ownerRole: 'student' | 'tutor';
}

export interface ReferralConversion {
  readonly code: string;
  readonly newUserId: string;
  readonly convertedAt: string;
  readonly rewardAppliedAt: string | null;
}
