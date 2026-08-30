import type { LessonRecap } from '@mojo/ai-learning/domain';
import type { DeliveryConfirmation } from '@mojo/booking/domain';
import type { User } from '@mojo/identity/domain';
import type { Message } from '@mojo/messaging/domain';
import type { MojoPlusSubscription } from '@mojo/mojo-plus/domain';
import type { NotificationPreferences } from '@mojo/notifications/domain';
import type { PayoutRequest, WalletTransaction } from '@mojo/payments/domain';
import type { ReferralConversion, ReferralLink } from '@mojo/referrals/domain';
import type { Review } from '@mojo/reviews/domain';
import type {
  AvailabilityException,
  AvailabilityRule,
  ScheduledSession,
  SchedulingSettings,
} from '@mojo/scheduling/domain';
import type { Money } from '@mojo/shared/domain';
import type { Dispute } from '@mojo/trust-safety/domain';
import type { TutorPerformance } from '@mojo/tutor-performance/domain';
import type { TutorApplication, TutorProfile } from '@mojo/tutor-profile/domain';

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

const STATE_SYMBOL = Symbol.for('mojo.demo.state');

/**
 * Process-global in-memory demo data, the single `DemoState` for the demo.
 * The hub app's repositories read and write these maps so mutations are
 * visible across its pages and API routes, and the admin app's
 * application/profile repositories bind against the same store so an approve
 * or reject decision lands on the exact application the hub submitted.
 * Next.js dev evaluates each route in its own module scope, so a plain
 * module-level singleton would give every page its own freshly-seeded copy —
 * the browser demo loop would never see submissions. Stashing the state on
 * `globalThis` makes all chunks share one store. Not durable — the whole
 * point is to run with zero infra; the `USE_PRISMA` env switch swaps these
 * for real Prisma repositories.
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
  readonly notificationPreferences = new Map<string, NotificationPreferences>();

  /** sessionId:templateId -> firedAt (dedupes scheduled reminder leads). */
  readonly reminderJournal = new Map<string, string>();

  /** Filled by `getHub()`; awaited by identity ops that race demo seeding. */
  seedReady: Promise<void> | null = null;

  creditsMinor = 0;
}

/** Returns the process-wide demo store, creating it on first use. */
export function sharedDemoState(): DemoState {
  const globals = globalThis as Record<PropertyKey, unknown>;
  const existing = globals[STATE_SYMBOL] as DemoState | undefined;
  if (existing) return existing;
  const fresh = new DemoState();
  globals[STATE_SYMBOL] = fresh;
  return fresh;
}

/** Drops the shared store (test teardown only). */
export function clearSharedDemoState(): void {
  delete (globalThis as Record<PropertyKey, unknown>)[STATE_SYMBOL];
}

export type MoneyState = Money;

export type { DeliveryConfirmation, ScheduledSession, TutorApplication, TutorProfile };
