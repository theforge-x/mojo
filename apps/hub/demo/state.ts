import type { User } from '@mojo/identity/domain';
import type { ScheduledSession } from '@mojo/scheduling/domain';
import type { AvailabilityException, AvailabilityRule, SchedulingSettings } from '@mojo/scheduling/domain';
import type { DeliveryConfirmation } from '@mojo/booking/domain';
import type { Money } from '@mojo/shared/domain';
import type { WalletTransaction } from '@mojo/payments/domain';
import type { PayoutRequest } from '@mojo/payments/domain';
import type { TutorPerformance } from '@mojo/tutor-performance/domain';
import type { MojoPlusSubscription } from '@mojo/mojo-plus/domain';
import type { LessonRecap } from '@mojo/ai-learning/domain';
import type { Review } from '@mojo/reviews/domain';
import type { ReferralConversion, ReferralLink } from '@mojo/referrals/domain';
import type { Dispute } from '@mojo/trust-safety/domain';
import type { Message } from '@mojo/messaging/domain';
import type { TutorProfile } from '@mojo/tutor-profile/domain';
import type { TutorApplication } from '@mojo/tutor-profile/domain';

export interface SentNotification {
  readonly id: string;
  readonly channel: 'email' | 'whatsapp';
  readonly to: string;
  readonly templateId: string;
  readonly data: Record<string, unknown>;
  readonly sentAt: string;
}

let serial = 0;
export function demoId(prefix: string): string {
  serial += 1;
  return `${prefix}_${serial}`;
}

/**
 * Process-local in-memory demo data, shared by every repository in the hub
 * app's composition root so mutations are visible across pages and API
 * routes. Not durable — the whole point is to run with zero infra; the
 * `USE_PRISMA` env switch swaps these for real Prisma repositories.
 */
export class DemoState {
  readonly users = new Map<string, User>();
  readonly sessions = new Map<string, ScheduledSession>();
  readonly confirmationBySession = new Map<string, DeliveryConfirmation>();
  readonly availabilityRules = new Map<string, AvailabilityRule[]>();
  readonly availabilityExceptions = new Map<string, AvailabilityException[]>();
  readonly schedulingSettings = new Map<string, SchedulingSettings>();
  readonly applications = new Map<string, TutorApplication>();
  readonly profiles = new Map<string, TutorProfile>();
  readonly performances = new Map<string, TutorPerformance>();
  readonly mojoPlus = new Map<string, MojoPlusSubscription>();
  readonly walletBalancesMinor = new Map<string, number>();
  readonly walletTransactions: WalletTransaction[] = [];
  readonly payoutRequests: PayoutRequest[] = [];
  readonly recaps = new Map<string, LessonRecap>();
  readonly reviews = new Map<string, Review>();
  readonly referralLinks = new Map<string, ReferralLink>();
  readonly referralConversions: ReferralConversion[] = [];
  readonly disputes = new Map<string, Dispute>();
  readonly messages = new Map<string, Message>();
  readonly notifications: SentNotification[] = [];

  creditsMinor = 0;
}

export type MoneyState = Money;

export type { ScheduledSession, DeliveryConfirmation, TutorProfile, TutorApplication };