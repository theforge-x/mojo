import type { LessonRecap, RecapRepository, TranscriptSummarizer } from '@mojo/ai-learning/domain';
import type { BookingRepository, BookingSession, DeliveryConfirmation } from '@mojo/booking/domain';
import { type DemoState, demoId } from '@mojo/demo-state';
import {
  type AvailabilityExceptionView,
  type AvailabilityView,
  type AvailabilityWindowView,
  hasAvailabilityWithin,
  type TutorSearchFilters,
  type TutorSearchIndex,
  type TutorSearchResult,
  tutorMatchesFilters,
} from '@mojo/discovery/domain';
import type { Role, TokenIssuer, User, UserRepository } from '@mojo/identity/domain';
import type {
  InterestRepository,
  Message,
  MessageRepository,
  TutorInterest,
} from '@mojo/messaging/domain';
import type { MojoPlusRepository, MojoPlusSubscription } from '@mojo/mojo-plus/domain';
import type {
  PayoutRail,
  PayoutRequest,
  Wallet,
  WalletRepository,
  WalletTransaction,
} from '@mojo/payments/domain';
import type { TutorLevelReader } from '@mojo/pricing/domain';
import type { ReferralConversion, ReferralLink, ReferralRepository } from '@mojo/referrals/domain';
import type { Review, ReviewRepository } from '@mojo/reviews/domain';
import type {
  AvailabilityException,
  AvailabilityRepository,
  AvailabilityRule,
  ScheduledSession,
  SchedulingSettings,
  SessionRepository,
} from '@mojo/scheduling/domain';
import { type Money, money, type TutorLevel } from '@mojo/shared/domain';
import type { Dispute, DisputeRepository } from '@mojo/trust-safety/domain';
import type { TutorPerformance, TutorPerformanceRepository } from '@mojo/tutor-performance/domain';
import type {
  ApplicationRepository,
  TutorApplication,
  TutorProfile,
  TutorProfileRepository,
} from '@mojo/tutor-profile/domain';

export const DEFAULT_RATE_MINOR: Record<TutorLevel, number> = {
  entry: 400_000,
  established: 600_000,
  expert: 800_000,
};

export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly state: DemoState) {}

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.state.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.state.users.get(id) ?? null;
  }

  async save(user: User): Promise<void> {
    this.state.users.set(user.id, user);
  }
}

export class MemTokenIssuer implements TokenIssuer {
  async issue(userId: string): Promise<{ token: string; expiresAt: string }> {
    return {
      token: `demo-${userId}-${crypto.randomUUID().replace(/-/g, '')}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}

export class InMemoryAvailabilityRepository implements AvailabilityRepository {
  constructor(private readonly state: DemoState) {}

  async getRules(tutorId: string): Promise<AvailabilityRule[]> {
    return this.state.availabilityRules.get(tutorId) ?? [];
  }

  async getExceptions(tutorId: string, date: string): Promise<AvailabilityException[]> {
    return (this.state.availabilityExceptions.get(tutorId) ?? []).filter((e) => e.date === date);
  }

  async listExceptions(
    tutorId: string,
    fromDate: string,
    toDate: string,
  ): Promise<AvailabilityException[]> {
    return (this.state.availabilityExceptions.get(tutorId) ?? [])
      .filter((e) => e.date >= fromDate && e.date <= toDate)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute);
  }

  async saveExceptions(
    tutorId: string,
    date: string,
    exceptions: Omit<AvailabilityException, 'tutorId' | 'date'>[],
  ): Promise<void> {
    const others = (this.state.availabilityExceptions.get(tutorId) ?? []).filter(
      (e) => e.date !== date,
    );
    this.state.availabilityExceptions.set(
      tutorId,
      [...others, ...exceptions.map((e) => ({ ...e, tutorId, date }))].sort(
        (a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute,
      ),
    );
  }

  async getSettings(tutorId: string): Promise<SchedulingSettings> {
    return (
      this.state.schedulingSettings.get(tutorId) ?? {
        tutorId,
        timezone: 'Africa/Lagos',
        bufferMinutes: 15,
        minimumNoticeMinutes: 60,
        pausedForNewBookings: false,
      }
    );
  }

  async saveRules(rules: AvailabilityRule[]): Promise<void> {
    const tutorId = rules[0]?.tutorId ?? '';
    const withIds = rules.map((rule) => (rule.id ? rule : { ...rule, id: demoId('rule') }));
    this.state.availabilityRules.set(tutorId, withIds);
  }

  async saveSettings(settings: SchedulingSettings): Promise<void> {
    this.state.schedulingSettings.set(settings.tutorId, settings);
  }
}

export class InMemorySessionRepository implements SessionRepository {
  constructor(private readonly state: DemoState) {}

  async getBookedSessions(
    tutorId: string,
    rangeStartIso: string,
    rangeEndIso: string,
  ): Promise<ScheduledSession[]> {
    return [...this.state.sessions.values()]
      .filter((s) => s.tutorId === tutorId && s.startIso < rangeEndIso && s.endIso > rangeStartIso)
      .sort((a, b) => a.startIso.localeCompare(b.startIso));
  }

  async save(session: ScheduledSession): Promise<void> {
    this.state.sessions.set(session.id, session);
  }

  async findById(id: string): Promise<ScheduledSession | null> {
    return this.state.sessions.get(id) ?? null;
  }

  listByTutor(tutorId: string): ScheduledSession[] {
    return [...this.state.sessions.values()]
      .filter((s) => s.tutorId === tutorId)
      .sort((a, b) => a.startIso.localeCompare(b.startIso));
  }

  listByStudent(studentId: string): ScheduledSession[] {
    return [...this.state.sessions.values()]
      .filter((s) => s.studentId === studentId)
      .sort((a, b) => a.startIso.localeCompare(b.startIso));
  }
}

export class InMemoryBookingRepository implements BookingRepository {
  constructor(private readonly state: DemoState) {}

  async findById(sessionId: string): Promise<BookingSession | null> {
    const session = this.state.sessions.get(sessionId);
    if (!session) return null;
    return {
      id: session.id,
      tutorId: session.tutorId,
      studentId: session.studentId,
      startIso: session.startIso,
      endIso: session.endIso,
      isTrial: session.isTrial,
    };
  }

  async markCompleted(sessionId: string, at: string): Promise<void> {
    this.patchStatus(sessionId, 'completed', at);
  }

  async markNoShow(sessionId: string, by: 'student' | 'tutor', at: string): Promise<void> {
    void by;
    this.patchStatus(sessionId, 'no_show', at);
  }

  async saveConfirmation(confirmation: DeliveryConfirmation): Promise<void> {
    this.state.confirmationBySession.set(confirmation.sessionId, confirmation);
  }

  private patchStatus(sessionId: string, status: ScheduledSession['status'], at: string): void {
    const session = this.state.sessions.get(sessionId);
    if (!session) return;
    this.state.sessions.set(sessionId, {
      ...session,
      status,
      statusHistory: [...session.statusHistory, { status, at }],
    });
  }
}

export class InMemoryTutorLevelReader implements TutorLevelReader {
  constructor(private readonly state: DemoState) {}

  async getLevel(tutorId: string): Promise<TutorLevel> {
    return this.state.performances.get(tutorId)?.level ?? 'entry';
  }

  async hasMojoPlus(tutorId: string): Promise<boolean> {
    return this.state.mojoPlus.get(tutorId)?.status === 'active';
  }

  async getCustomRateMinor(tutorId: string): Promise<number | null> {
    const sub = this.state.mojoPlus.get(tutorId);
    return sub?.status === 'active' ? sub.customSegmentRateMinor : null;
  }
}

export class InMemoryWalletRepository implements WalletRepository {
  constructor(private readonly state: DemoState) {}

  async getWallet(tutorId: string): Promise<Wallet> {
    return { tutorId, balance: money(this.state.walletBalancesMinor.get(tutorId) ?? 0, 'NGN') };
  }

  async credit(
    tutorId: string,
    amount: Money,
    relatedSessionId: string | null,
  ): Promise<WalletTransaction> {
    const current = this.state.walletBalancesMinor.get(tutorId) ?? 0;
    this.state.walletBalancesMinor.set(tutorId, current + amount.amountMinor);
    this.state.creditsMinor += amount.amountMinor;
    const transaction: WalletTransaction = {
      id: demoId('tx'),
      tutorId,
      kind: 'credit',
      amount,
      relatedSessionId,
      createdAt: new Date().toISOString(),
    };
    this.state.walletTransactions.push(transaction);
    return transaction;
  }

  async savePayoutRequest(request: PayoutRequest): Promise<void> {
    this.state.payoutRequests.push(request);
  }
}

export class InMemoryPayoutRail implements PayoutRail {
  async send(tutorId: string, _amount: Money): Promise<{ externalRef: string }> {
    return { externalRef: `demo-${tutorId}-${Math.random().toString(36).slice(2)}` };
  }
}

export class InMemoryTutorPerformanceRepository implements TutorPerformanceRepository {
  constructor(private readonly state: DemoState) {}

  async findByTutorId(tutorId: string): Promise<TutorPerformance | null> {
    return this.state.performances.get(tutorId) ?? null;
  }

  async save(perf: TutorPerformance): Promise<void> {
    this.state.performances.set(perf.tutorId, perf);
  }
}

export class InMemoryMojoPlusRepository implements MojoPlusRepository {
  constructor(private readonly state: DemoState) {}

  async find(tutorId: string): Promise<MojoPlusSubscription | null> {
    return this.state.mojoPlus.get(tutorId) ?? null;
  }

  async save(subscription: MojoPlusSubscription): Promise<void> {
    this.state.mojoPlus.set(subscription.tutorId, subscription);
  }
}

export class InMemoryReviewRepository implements ReviewRepository {
  constructor(private readonly state: DemoState) {}

  async findById(id: string): Promise<Review | null> {
    return this.state.reviews.get(id) ?? null;
  }

  async findBySession(sessionId: string): Promise<Review | null> {
    for (const review of this.state.reviews.values()) {
      if (review.sessionId === sessionId) return review;
    }
    return null;
  }

  async save(review: Review): Promise<void> {
    this.state.reviews.set(review.id, review);
  }
}

export class InMemoryReferralRepository implements ReferralRepository {
  constructor(private readonly state: DemoState) {}

  async findLink(code: string): Promise<ReferralLink | null> {
    return this.state.referralLinks.get(code) ?? null;
  }

  async saveLink(link: ReferralLink): Promise<void> {
    this.state.referralLinks.set(link.code, link);
  }

  async findConversion(code: string, newUserId: string): Promise<ReferralConversion | null> {
    return (
      this.state.referralConversions.find((c) => c.code === code && c.newUserId === newUserId) ??
      null
    );
  }

  async saveConversion(conversion: ReferralConversion): Promise<void> {
    this.state.referralConversions.push(conversion);
  }
}

export class InMemoryDisputeRepository implements DisputeRepository {
  constructor(private readonly state: DemoState) {}

  async findById(id: string): Promise<Dispute | null> {
    return this.state.disputes.get(id) ?? null;
  }

  async findBySession(sessionId: string): Promise<Dispute | null> {
    for (const dispute of this.state.disputes.values()) {
      if (dispute.sessionId === sessionId) return dispute;
    }
    return null;
  }

  async save(dispute: Dispute): Promise<void> {
    this.state.disputes.set(dispute.id, dispute);
  }
}

export class InMemoryMessageRepository implements MessageRepository {
  constructor(private readonly state: DemoState) {}

  async findById(id: string): Promise<Message | null> {
    return this.state.messages.get(id) ?? null;
  }

  async save(message: Message): Promise<void> {
    this.state.messages.set(message.id, message);
  }

  async listBetween(participantA: string, participantB: string): Promise<Message[]> {
    return [...this.state.messages.values()]
      .filter(
        (m) =>
          (m.senderId === participantA && m.recipientId === participantB) ||
          (m.senderId === participantB && m.recipientId === participantA),
      )
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  }

  async listThreadsFor(participantId: string): Promise<string[]> {
    const partners = new Set<string>();
    for (const message of this.state.messages.values()) {
      if (message.senderId !== participantId) partners.add(message.senderId);
      if (message.recipientId !== participantId) partners.add(message.recipientId);
    }
    return [...partners];
  }

  async markRead(id: string, at: string): Promise<void> {
    const message = this.state.messages.get(id);
    if (!message) return;
    this.state.messages.set(id, { ...message, readAt: at });
  }
}

export class InMemoryInterestRepository implements InterestRepository {
  constructor(private readonly state: DemoState) {}

  private key(studentId: string, tutorId: string): string {
    return `${studentId}:${tutorId}`;
  }

  async find(studentId: string, tutorId: string): Promise<TutorInterest | null> {
    return this.state.tutorInterests.get(this.key(studentId, tutorId)) ?? null;
  }

  async record(interest: TutorInterest): Promise<void> {
    this.state.tutorInterests.set(this.key(interest.studentId, interest.tutorId), interest);
  }

  async forTutor(tutorId: string): Promise<TutorInterest[]> {
    return [...this.state.tutorInterests.values()]
      .filter((i) => i.tutorId === tutorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export class InMemoryTutorSearchIndex implements TutorSearchIndex {
  constructor(private readonly state: DemoState) {}

  async search(filters: TutorSearchFilters): Promise<TutorSearchResult[]> {
    return [...this.state.profiles.values()]
      .filter((profile) => {
        const perf = this.state.performances.get(profile.tutorId);
        const level = perf?.level ?? 'entry';
        const rating = perf?.averageRating ?? 0;
        if (
          !tutorMatchesFilters(
            { subjects: profile.subjects, languages: profile.languages, level, rating },
            filters,
          )
        ) {
          return false;
        }
        if (filters.availableWithinHours !== undefined) {
          return hasAvailabilityWithin(
            this.availabilityViewOf(profile.tutorId, profile.timezone),
            filters.availableWithinHours,
          );
        }
        return true;
      })
      .map((profile) => {
        const perf = this.state.performances.get(profile.tutorId);
        const level = perf?.level ?? 'entry';
        return {
          tutorId: profile.tutorId,
          displayName: profile.displayName,
          photoUrl: profile.photoUrl,
          education: profile.education,
          timezone: profile.timezone,
          level,
          perSegmentMinor: DEFAULT_RATE_MINOR[level],
          rating: perf?.averageRating ?? 0,
          responseTimeMinutesAvg: perf?.responseTimeMinutesAvg ?? 0,
        };
      });
  }

  private availabilityViewOf(tutorId: string, timezone: string): AvailabilityView {
    const rules: AvailabilityWindowView[] = (this.state.availabilityRules.get(tutorId) ?? []).map(
      (rule) => ({
        weekday: rule.weekday,
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
      }),
    );
    const exceptions: AvailabilityExceptionView[] = (
      this.state.availabilityExceptions.get(tutorId) ?? []
    ).map((exception) => ({
      dateKey: exception.date,
      kind: exception.kind,
      startMinute: exception.startMinute,
      endMinute: exception.endMinute,
    }));
    const settings = this.state.schedulingSettings.get(tutorId);
    return {
      timezone,
      rules,
      exceptions,
      settings: settings
        ? {
            bufferMinutes: settings.bufferMinutes,
            minimumNoticeMinutes: settings.minimumNoticeMinutes,
            pausedForNewBookings: settings.pausedForNewBookings,
          }
        : null,
    };
  }
}

export class InMemoryApplicationRepository implements ApplicationRepository {
  constructor(private readonly state: DemoState) {}

  async findById(applicationId: string): Promise<TutorApplication | null> {
    return this.state.applications.get(applicationId) ?? null;
  }

  async save(application: TutorApplication): Promise<void> {
    this.state.applications.set(application.id, application);
  }

  async list(): Promise<TutorApplication[]> {
    return [...this.state.applications.values()];
  }
}

export class InMemoryTutorProfileRepository implements TutorProfileRepository {
  constructor(private readonly state: DemoState) {}

  async findByTutorId(tutorId: string): Promise<TutorProfile | null> {
    return this.state.profiles.get(tutorId) ?? null;
  }

  async save(profile: TutorProfile): Promise<void> {
    this.state.profiles.set(profile.tutorId, profile);
  }
}

export class InMemoryRecapRepository implements RecapRepository {
  constructor(private readonly state: DemoState) {}

  async findBySession(sessionId: string): Promise<LessonRecap | null> {
    return this.state.recaps.get(sessionId) ?? null;
  }

  async save(recap: LessonRecap): Promise<void> {
    this.state.recaps.set(recap.sessionId, recap);
  }
}

export const demoTranscriptSummarizer: TranscriptSummarizer = {
  async summarize(transcript) {
    const preview = transcript.trim().slice(0, 160);
    return {
      summary: preview ? `Recap of your session: “${preview}…”` : 'Recap of your session.',
      focusAreas: ['vocabulary', 'pronunciation'],
    };
  },
};

export type DemoRole = Role;
export type { PayoutRequest, ScheduledSession, TutorApplication, TutorProfile, User };
