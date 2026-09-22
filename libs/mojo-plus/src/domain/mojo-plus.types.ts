export interface MojoPlusSubscription {
  readonly tutorId: string;
  readonly status: 'active' | 'cancelled';
  readonly customSegmentRateMinor: number | null;
  readonly subscribedAt: string;
  readonly cancelledAt: string | null;
}

/** Everything a Mojo+ subscription unlocks. Outreach is the lead-generation perk. */
export const MOJO_PLUS_BENEFITS = ['custom-pricing', 'take-home-bonus', 'tutor-outreach'] as const;

export type MojoPlusBenefit = (typeof MOJO_PLUS_BENEFITS)[number];

export function isMojoPlusActive(
  subscription: MojoPlusSubscription | null | undefined,
): subscription is MojoPlusSubscription {
  return subscription?.status === 'active';
}

/**
 * An interested student (a "lead") for tutor outreach.
 *
 * Declared locally — structurally compatible with the messaging module's
 * `TutorInterest` — so this domain stays isolated (dependency inversion:
 * the composition root adapts the messaging repository to {@link OutreachLeadRepository}).
 */
export interface OutreachLead {
  readonly studentId: string;
  readonly tutorId: string;
  readonly source: 'search' | 'view';
  readonly createdAt: string;
}

// Re-exported here so existing `.../domain` imports keep working; new code
// should import the port from `./mojo-plus.ports`.
export type { MojoPlusRepository } from './mojo-plus.ports';
