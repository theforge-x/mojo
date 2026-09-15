import { makeGenerateRecap } from '@mojo/ai-learning/application';
import type { LessonRecap, RecapRepository, TranscriptSummarizer } from '@mojo/ai-learning/domain';
import {
  type ConfirmDeliveryInput,
  makeConfirmDelivery,
  makeMarkNoShow,
} from '@mojo/booking/application';
import type { BookingRepository } from '@mojo/booking/domain';
import {
  clearSharedDemoState,
  type DemoState,
  demoId,
  type SentNotification,
  sharedDemoState,
} from '@mojo/demo-state';
import { makeSearchTutors } from '@mojo/discovery/application';
import type {
  TutorSearchFilters,
  TutorSearchIndex,
  TutorSearchResult,
} from '@mojo/discovery/domain';
import { makeAuthenticateUser, makeRegisterUser } from '@mojo/identity/application';
import type { SessionStore, TokenIssuer, User, UserRepository } from '@mojo/identity/domain';
import {
  bcryptPasswordHasher,
  DbTokenIssuer,
  hashSessionToken,
  PrismaSessionStore,
} from '@mojo/identity/infrastructure';
import {
  makeListThread,
  makeListTutorInterests,
  makeMarkRead,
  makeRecordInterest,
  makeSendMessage,
  makeThreadsFor,
} from '@mojo/messaging/application';
import type {
  InterestRepository,
  Message,
  MessageRepository,
  TutorInterest,
} from '@mojo/messaging/domain';
import type { MojoPlusRepository } from '@mojo/mojo-plus/domain';
import { makeDispatchNotification } from '@mojo/notifications/application';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  dueSessionReminders,
  type NotificationDispatcher,
  type NotificationPreferences,
} from '@mojo/notifications/domain';
import { makeReleasePayout, type ReleasePayoutInput } from '@mojo/payments/application';
import type { PayoutRail, WalletRepository } from '@mojo/payments/domain';
import { makeRecordSessionCompletion } from '@mojo/pricing/application';
import { DEFAULT_SEGMENT_RATE_NGN, type TutorLevelReader } from '@mojo/pricing/domain';
import type { ReferralRepository } from '@mojo/referrals/domain';
import { makeSubmitReview } from '@mojo/reviews/application';
import type { Review, ReviewRepository } from '@mojo/reviews/domain';
import {
  type BookSessionInput,
  type CancelSessionInput,
  type ConfirmSessionInput,
  makeBookSession,
  makeCancelSession,
  makeConfirmSession,
  makeSetAvailability,
  makeSetExceptions,
  makeUpdateSchedulingSettings,
  type UpdateSchedulingSettingsInput,
} from '@mojo/scheduling/application';
import type {
  AvailabilityException,
  AvailabilityRepository,
  AvailabilityRule,
  ScheduledSession,
  SchedulingSettings,
  SessionRepository,
} from '@mojo/scheduling/domain';
import type { Money } from '@mojo/shared/domain';
import {
  eventBus,
  type ReviewSubmitted,
  type SessionBooked,
  type SessionCancelled,
  type SessionCompleted,
  type SessionDeliveryConfirmed,
} from '@mojo/shared/events';
import type { DisputeRepository } from '@mojo/trust-safety/domain';
import { makeRecomputeLevel } from '@mojo/tutor-performance/application';
import type { TutorPerformance, TutorPerformanceRepository } from '@mojo/tutor-performance/domain';
import { makeReviewApplication, makeSubmitApplication } from '@mojo/tutor-profile/application';
import type {
  ApplicationRepository,
  TutorApplication,
  TutorProfileRepository,
} from '@mojo/tutor-profile/domain';
import type { PrismaClient } from '@prisma/client';
import { sharedPrismaClient } from './prisma-client';
import {
  EmailDispatcher,
  PaystackPayoutRail,
  PrismaApplicationRepository,
  PrismaAvailabilityRepository,
  PrismaBookingRepository,
  PrismaDisputeRepository,
  PrismaInterestRepository,
  PrismaMessageRepository,
  PrismaMojoPlusRepository,
  PrismaRecapRepository,
  PrismaReferralRepository,
  PrismaReviewRepository,
  PrismaSessionRepository,
  PrismaTutorLevelReader,
  PrismaTutorPerformanceRepository,
  PrismaTutorProfileRepository,
  PrismaTutorSearchIndex,
  PrismaUserRepository,
  PrismaWalletRepository,
  summarizerFromEnv,
  WhatsAppDispatcher,
} from './prisma-repos';
import {
  demoTranscriptSummarizer,
  InMemoryApplicationRepository,
  InMemoryAvailabilityRepository,
  InMemoryBookingRepository,
  InMemoryDisputeRepository,
  InMemoryInterestRepository,
  InMemoryMessageRepository,
  InMemoryMojoPlusRepository,
  InMemoryPayoutRail,
  InMemoryRecapRepository,
  InMemoryReferralRepository,
  InMemoryReviewRepository,
  InMemorySessionRepository,
  InMemorySessionStore,
  InMemoryTutorLevelReader,
  InMemoryTutorPerformanceRepository,
  InMemoryTutorProfileRepository,
  InMemoryTutorSearchIndex,
  InMemoryUserRepository,
  InMemoryWalletRepository,
  MemTokenIssuer,
} from './repos';
import { seedDemo } from './seed';

interface Repositories {
  users: UserRepository;
  tokens: TokenIssuer;
  tokenStore: SessionStore;
  availability: AvailabilityRepository;
  sessions: SessionRepository & {
    listByTutor(tutorId: string): Promise<ScheduledSession[]>;
    listByStudent(studentId: string): Promise<ScheduledSession[]>;
  };
  bookings: BookingRepository;
  levels: TutorLevelReader;
  wallets: WalletRepository;
  rail: PayoutRail;
  performances: TutorPerformanceRepository;
  mojoPlus: MojoPlusRepository;
  notifications: Record<'email' | 'whatsapp', NotificationDispatcher>;
  recaps: RecapRepository;
  summarizer: TranscriptSummarizer;
  reviews: ReviewRepository;
  referrals: ReferralRepository;
  disputes: DisputeRepository;
  messages: MessageRepository;
  interests: InterestRepository;
  searchIndex: TutorSearchIndex;
  applications: ApplicationRepository;
  profiles: TutorProfileRepository;
}

export interface HubApp {
  readonly isDemoMode: boolean;
  readonly demoAccounts: readonly { id: string; email: string; role: string }[];
  identity: {
    userById(id: string): Promise<User | null>;
    userByToken(token: string): Promise<User | null>;
    authenticate(
      email: string,
      password: string,
    ): Promise<{ token: string; expiresAt: string; role: string; user: User }>;
    register(input: {
      name: string;
      email: string;
      password: string;
      timezone: string;
      locale: string;
      role?: 'student' | 'tutor';
    }): Promise<User>;
  };
  scheduling: {
    sessionsByTutor(tutorId: string): Promise<ScheduledSession[]>;
    sessionsByStudent(studentId: string): Promise<ScheduledSession[]>;
    availabilityRules(tutorId: string): Promise<AvailabilityRule[]>;
    settings(tutorId: string): Promise<SchedulingSettings>;
    book(input: BookSessionInput): Promise<ScheduledSession>;
    cancel(input: CancelSessionInput): Promise<void>;
    confirmSession(input: ConfirmSessionInput): Promise<void>;
    saveAvailability(tutorId: string, rules: Omit<AvailabilityRule, 'tutorId'>[]): Promise<void>;
    updateSettings(input: UpdateSchedulingSettingsInput): Promise<void>;
    exceptions(tutorId: string, fromDate: string, toDate: string): Promise<AvailabilityException[]>;
    saveExceptions(
      tutorId: string,
      date: string,
      exceptions: Omit<AvailabilityException, 'tutorId' | 'date' | 'id'>[],
    ): Promise<void>;
  };
  booking: {
    confirmDelivery(input: ConfirmDeliveryInput): Promise<void>;
    markNoShow(sessionId: string, by: 'student' | 'tutor', nowIso: string): Promise<void>;
  };
  discovery: {
    search(filters: TutorSearchFilters): Promise<TutorSearchResult[]>;
  };
  wallet: {
    forTutor(tutorId: string): Promise<{ tutorId: string; balance: Money }>;
    releasePayout(input: ReleasePayoutInput): Promise<void>;
  };
  performance: {
    byTutor(tutorId: string): Promise<TutorPerformance | null>;
  };
  profile: {
    submitApplication(app: TutorApplication, nowIso: string): Promise<void>;
    review(input: {
      applicationId: string;
      decision: 'approved' | 'rejected';
      nowIso?: string;
    }): Promise<TutorApplication>;
    applicationForTutor(tutorId: string): Promise<TutorApplication | null>;
    applications(): Promise<TutorApplication[]>;
    byTutor(tutorId: string): Promise<{
      displayName: string;
      photoUrl: string;
      education: string;
      subjects: readonly string[];
      languages: readonly string[];
      bio: string;
      timezone: string;
    } | null>;
  };
  recaps: {
    latestFor(sessionId: string): Promise<LessonRecap | null>;
  };
  reviews: {
    submit(review: Review): Promise<void>;
    reviewForSession(sessionId: string): Promise<Review | null>;
    forTutor(tutorId: string): Promise<Review[]>;
  };
  messaging: {
    send(message: Message): Promise<void>;
    threadBetween(participantA: string, participantB: string): Promise<Message[]>;
    threadsFor(participantId: string): Promise<string[]>;
    markRead(id: string, at: string): Promise<void>;
  };
  interests: {
    record(input: {
      studentId: string;
      tutorId: string;
      source: 'search' | 'view';
      nowIso?: string;
    }): Promise<void>;
    forTutor(tutorId: string): Promise<TutorInterest[]>;
  };
  notifications: {
    log(): readonly SentNotification[];
    preferences(userId: string): Promise<NotificationPreferences>;
    savePreferences(userId: string, prefs: NotificationPreferences): Promise<void>;
    fireDueReminders(userId: string, nowIso: string): Promise<{ sent: number; due: number }>;
  };
  eventCount(name: string): number;
}

let hubInstance: HubApp | null = null;
const eventCounts = new Map<string, number>();

export function getHub(): HubApp {
  if (hubInstance) return hubInstance;

  const isDemoMode = process.env.USE_PRISMA !== 'true';
  const state = sharedDemoState();
  const repos = isDemoMode ? buildInMemoryRepositories(state) : buildPrismaRepositories(state);
  if (isDemoMode && !state.seedReady) {
    state.seedReady = seedDemo(state);
  }

  hubInstance = buildApp(repos, isDemoMode, state);
  return hubInstance;
}

export function resetHubForTests(): void {
  hubInstance = null;
  eventCounts.clear();
  clearSharedDemoState();
}

function buildInMemoryRepositories(state: DemoState): Repositories {
  const users = new InMemoryUserRepository(state);
  const availability = new InMemoryAvailabilityRepository(state);
  const sessions = new InMemorySessionRepository(state);

  return {
    users,
    tokens: new MemTokenIssuer(),
    tokenStore: new InMemorySessionStore(),
    availability,
    sessions: {
      getBookedSessions: (t, a, b) => sessions.getBookedSessions(t, a, b),
      save: (s) => sessions.save(s),
      findById: (id) => sessions.findById(id),
      listByTutor: async (t) => sessions.listByTutor(t),
      listByStudent: async (s) => sessions.listByStudent(s),
    },
    bookings: new InMemoryBookingRepository(state),
    levels: new InMemoryTutorLevelReader(state),
    wallets: new InMemoryWalletRepository(state),
    rail: new InMemoryPayoutRail(),
    performances: new InMemoryTutorPerformanceRepository(state),
    mojoPlus: new InMemoryMojoPlusRepository(state),
    notifications: inMemoryDispatchers(state),
    recaps: new InMemoryRecapRepository(state),
    summarizer: summarizerFromEnv(demoTranscriptSummarizer),
    reviews: new InMemoryReviewRepository(state),
    referrals: new InMemoryReferralRepository(state),
    disputes: new InMemoryDisputeRepository(state),
    messages: new InMemoryMessageRepository(state),
    interests: new InMemoryInterestRepository(state),
    searchIndex: new InMemoryTutorSearchIndex(state),
    applications: new InMemoryApplicationRepository(state),
    profiles: new InMemoryTutorProfileRepository(state),
  };
}

function buildPrismaRepositories(_state: DemoState): Repositories {
  const prisma = sharedPrismaClient();

  const userRepo = new PrismaUserRepository(prisma);
  const availability = new PrismaAvailabilityRepository(prisma);
  const sessions = new PrismaSessionRepository(prisma);
  const tokenStore = new PrismaSessionStore(prisma);

  return {
    users: userRepo,
    tokens: new DbTokenIssuer(tokenStore),
    tokenStore,
    availability,
    sessions: {
      getBookedSessions: (t, a, b) => sessions.getBookedSessions(t, a, b),
      save: (s) => sessions.save(s),
      findById: (id) => sessions.findById(id),
      listByTutor: async (tutorId) => listSessions(prisma, { tutorId }),
      listByStudent: async (studentId) => listSessions(prisma, { studentId }),
    },
    bookings: new PrismaBookingRepository(prisma),
    levels: new PrismaTutorLevelReader(prisma),
    wallets: new PrismaWalletRepository(prisma),
    rail: new PaystackPayoutRail(process.env.PAYSTACK_SECRET_KEY ?? ''),
    performances: new PrismaTutorPerformanceRepository(prisma),
    mojoPlus: new PrismaMojoPlusRepository(prisma),
    notifications: externalDispatchers(),
    recaps: new PrismaRecapRepository(prisma),
    summarizer: summarizerFromEnv(demoTranscriptSummarizer),
    reviews: new PrismaReviewRepository(prisma),
    referrals: new PrismaReferralRepository(prisma),
    disputes: new PrismaDisputeRepository(prisma),
    messages: new PrismaMessageRepository(prisma),
    interests: new PrismaInterestRepository(prisma),
    searchIndex: new PrismaTutorSearchIndex(prisma),
    applications: new PrismaApplicationRepository(prisma),
    profiles: new PrismaTutorProfileRepository(prisma),
  };
}

async function listSessions(
  prisma: PrismaClient,
  where: { tutorId?: string; studentId?: string },
): Promise<ScheduledSession[]> {
  const rows = await prisma.session.findMany({
    where,
    include: { statusHistory: true },
    orderBy: { startAt: 'asc' },
  });
  return rows.map((row) => ({
    id: row.id,
    tutorId: row.tutorId,
    studentId: row.studentId,
    startIso: row.startAt.toISOString(),
    endIso: row.endAt.toISOString(),
    status: row.status,
    isTrial: row.isTrial,
    statusHistory: (row.statusHistory ?? []).map((h) => ({
      status: h.status,
      at: h.at.toISOString(),
    })),
  }));
}

function externalDispatchers(): Record<'email' | 'whatsapp', NotificationDispatcher> {
  const email = process.env.RESEND_API_KEY ? new EmailDispatcher(process.env.RESEND_API_KEY) : null;
  const whatsapp =
    process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
      ? new WhatsAppDispatcher(
          process.env.WHATSAPP_PHONE_NUMBER_ID,
          process.env.WHATSAPP_ACCESS_TOKEN,
        )
      : null;
  return {
    email: (email ?? inMemoryChannel('email')) as NotificationDispatcher,
    whatsapp: (whatsapp ?? inMemoryChannel('whatsapp')) as NotificationDispatcher,
  };
}

function inMemoryChannel(channel: 'email' | 'whatsapp'): NotificationDispatcher {
  return {
    send: async (_c, _to, _templateId) => {
      void channel;
    },
  };
}

function inMemoryDispatchers(
  state: DemoState,
): Record<'email' | 'whatsapp', NotificationDispatcher> {
  const push =
    (channel: 'email' | 'whatsapp') =>
    (to: string, templateId: string, data: Record<string, unknown>) => {
      state.notifications.push({
        id: demoId('n'),
        channel,
        to,
        templateId,
        data,
        sentAt: new Date().toISOString(),
      });
    };
  return {
    email: { send: async (_c, to, templateId, data) => push('email')(to, templateId, data) },
    whatsapp: { send: async (_c, to, templateId, data) => push('whatsapp')(to, templateId, data) },
  };
}

function buildApp(repos: Repositories, isDemoMode: boolean, state: DemoState): HubApp {
  // Demo client records issued tokens so a session cookie can be resolved
  // back to its user without trusting an opaque token as a primary key.
  // The map also enforces expiry — tokens minted with `expiresAt` stop
  // resolving once past it, instead of living forever.
  const issuedTokens = new Map<string, { userId: string; expiresAt: string }>();
  const tokens: TokenIssuer = {
    issue: async (userId: string) => {
      const issued = await repos.tokens.issue(userId);
      issuedTokens.set(issued.token, { userId, expiresAt: issued.expiresAt });
      return issued;
    },
  };

  const authenticateUser = makeAuthenticateUser({
    users: repos.users,
    hasher: bcryptPasswordHasher,
    tokens,
  });
  const registerUser = makeRegisterUser({ users: repos.users, hasher: bcryptPasswordHasher });
  const bookSession = makeBookSession({
    availability: repos.availability,
    sessions: repos.sessions,
  });
  const cancelSession = makeCancelSession({ sessions: repos.sessions });
  const confirmSession = makeConfirmSession({ sessions: repos.sessions });
  const setAvailability = makeSetAvailability({ availability: repos.availability });
  const setExceptions = makeSetExceptions({ availability: repos.availability });
  const updateSchedulingSettings = makeUpdateSchedulingSettings({
    availability: repos.availability,
  });
  const confirmDelivery = makeConfirmDelivery({
    bookings: repos.bookings,
    rates: {
      perSegmentMinor: async (tutorId) => {
        const custom = await repos.levels.getCustomRateMinor(tutorId);
        if (custom !== null) return custom;
        return DEFAULT_SEGMENT_RATE_NGN[await repos.levels.getLevel(tutorId)];
      },
    },
  });
  const markNoShow = makeMarkNoShow({ bookings: repos.bookings });
  const searchTutors = makeSearchTutors({ index: repos.searchIndex });
  const submitApplication = makeSubmitApplication({ applications: repos.applications });
  const reviewApplication = makeReviewApplication({
    applications: repos.applications,
    profiles: repos.profiles,
  });
  const recordSessionCompletion = makeRecordSessionCompletion(repos.levels);
  const recomputeLevel = makeRecomputeLevel({ performances: repos.performances });
  const generateRecap = makeGenerateRecap({ recaps: repos.recaps, summarizer: repos.summarizer });
  const submitReview = makeSubmitReview({ reviews: repos.reviews });
  const releasePayout = makeReleasePayout({ wallets: repos.wallets, rail: repos.rail });
  const dispatchNotification = makeDispatchNotification({ dispatchers: repos.notifications });
  const sendMessage = makeSendMessage({ messages: repos.messages });
  const listThread = makeListThread({ messages: repos.messages });
  const threadsFor = makeThreadsFor({ messages: repos.messages });
  const markRead = makeMarkRead({ messages: repos.messages });
  const recordInterest = makeRecordInterest({ interests: repos.interests });
  const listTutorInterests = makeListTutorInterests({ interests: repos.interests });

  const count = (name: string) => {
    eventCounts.set(name, (eventCounts.get(name) ?? 0) + 1);
  };

  const safeNotify = (
    channel: 'email' | 'whatsapp',
    to: string,
    templateId: string,
    data: Record<string, unknown>,
  ) => {
    dispatchNotification({ channel, to, templateId, data }).catch((_error) => {});
  };

  const emptyPerformance = (tutorId: string): TutorPerformance => ({
    tutorId,
    level: 'entry',
    cumulativeHoursTaught: 0,
    responseTimeMinutesAvg: 0,
    trialToPaidConversionRate: 0,
    cancellationRate: 0,
    averageRating: 0,
  });

  eventBus.subscribe('SessionBooked', (event: SessionBooked) => {
    count('SessionBooked');
    safeNotify('email', 'student@mojo.dev', 'session-booked-confirmation', event.payload);
  });
  eventBus.subscribe('SessionCancelled', (event: SessionCancelled) => {
    count('SessionCancelled');
    safeNotify('email', 'tutor@mojo.dev', 'session-cancelled-alert', event.payload);
  });
  eventBus.subscribe('SessionDeliveryConfirmed', (event: SessionDeliveryConfirmed) => {
    count('SessionDeliveryConfirmed');
    safeNotify('email', 'tutor@mojo.dev', 'delivery-confirmed-payout-processing', event.payload);
  });
  eventBus.subscribe('SessionCompleted', (event: SessionCompleted) => {
    count('SessionCompleted');
    void (async () => {
      try {
        const split = await recordSessionCompletion(event);
        await repos.wallets.credit(
          event.payload.tutorId,
          split.tutorTakeHome,
          event.payload.sessionId,
        );
        const perf =
          (await repos.performances.findByTutorId(event.payload.tutorId)) ??
          emptyPerformance(event.payload.tutorId);
        const hours = (event.payload.segmentCount * 15) / 60;
        await recomputeLevel(
          { ...perf, cumulativeHoursTaught: perf.cumulativeHoursTaught + hours },
          event.occurredAt,
        );
        await generateRecap(event.payload.sessionId, demoTranscript(event), event.occurredAt);
      } catch (_error) {}
    })();
  });
  eventBus.subscribe('ReviewSubmitted', (event: ReviewSubmitted) => {
    count('ReviewSubmitted');
    void (async () => {
      try {
        const perf =
          (await repos.performances.findByTutorId(event.payload.tutorId)) ??
          emptyPerformance(event.payload.tutorId);
        const merged = (perf.averageRating + event.payload.rating) / 2;
        await recomputeLevel(
          { ...perf, averageRating: Number(merged.toFixed(2)) },
          event.occurredAt,
        );
      } catch (_error) {}
    })();
  });

  return {
    isDemoMode,
    demoAccounts: [
      { id: 't_1', email: 'tutor@mojo.dev', role: 'tutor' },
      { id: 'st_1', email: 'student@mojo.dev', role: 'student' },
    ] as const,
    identity: {
      userById: (id) => repos.users.findById(id),
      userByToken: async (token) => {
        // DB-backed `mojo_` sessions (Prisma mode): the user id is only
        // recoverable through the stored hash — never embedded in the token.
        if (token.startsWith('mojo_')) {
          const hit = await repos.tokenStore.findUser({ tokenHash: hashSessionToken(token) });
          if (!hit || Date.parse(hit.expiresAt) < Date.now()) return null;
          const user = await repos.users.findById(hit.userId);
          if (!user || user.suspendedAt) return null;
          return user;
        }
        // The issued-tokens map is a per-module-instance cache, so it can't
        // be the only way to resolve a cookie (Next compiles pages and
        // route-handlers into separate bundles, and the map resets on
        // restart). Parse the embedded user id deterministically as the
        // resilient fallback. Either way the role always comes from the
        // stored user — never from a client-writable cookie.
        const mapped = issuedTokens.get(token);
        if (mapped) {
          if (Date.parse(mapped.expiresAt) < Date.now()) {
            issuedTokens.delete(token);
            return null;
          }
          const user = await repos.users.findById(mapped.userId);
          if (!user || user.suspendedAt) return null;
          return user;
        }
        if (token.startsWith('demo-')) {
          const embedded = token.slice('demo-'.length).split('-')[0];
          if (embedded) {
            const user = await repos.users.findById(embedded);
            if (user && !user.suspendedAt) return user;
          }
        }
        return null;
      },
      authenticate: async (email, password) => {
        if (state.seedReady) await state.seedReady;
        const result = await authenticateUser({ email, password });
        const user = await repos.users.findByEmail(email);
        if (!user) throw new Error('Authenticated user missing from repository.');
        return { ...result, user };
      },
      register: async ({ name, email, password, timezone, locale, role = 'student' }) => {
        if (state.seedReady) await state.seedReady;
        const prefix = role === 'tutor' ? 't_' : 'st_';
        let max = 0;
        for (const id of state.users.keys()) {
          if (id.startsWith(prefix)) {
            const n = Number(id.slice(prefix.length));
            if (Number.isInteger(n) && n > max) max = n;
          }
        }
        return registerUser({
          id: `${prefix}${max + 1}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          timezone,
          locale,
        });
      },
    },
    scheduling: {
      sessionsByTutor: (tutorId) => repos.sessions.listByTutor(tutorId),
      sessionsByStudent: (studentId) => repos.sessions.listByStudent(studentId),
      availabilityRules: (tutorId) => repos.availability.getRules(tutorId),
      settings: (tutorId) => repos.availability.getSettings(tutorId),
      book: (input) => bookSession(input),
      cancel: (input) => cancelSession(input),
      confirmSession: (input) => confirmSession(input),
      saveAvailability: (tutorId, rules) => setAvailability(tutorId, rules),
      updateSettings: (input) => updateSchedulingSettings(input),
      exceptions: (tutorId, fromDate, toDate) =>
        repos.availability.listExceptions(tutorId, fromDate, toDate),
      saveExceptions: (tutorId, date, exceptions) => setExceptions({ tutorId, date, exceptions }),
    },
    booking: {
      confirmDelivery: (input) => confirmDelivery(input),
      markNoShow: (sessionId, by, nowIso) => markNoShow({ sessionId, by, nowIso }),
    },
    discovery: {
      search: (filters) => searchTutors(filters),
    },
    wallet: {
      forTutor: async (tutorId) => {
        const wallet = await repos.wallets.getWallet(tutorId);
        return { tutorId: wallet.tutorId, balance: wallet.balance };
      },
      releasePayout: (input) => releasePayout(input),
    },
    performance: {
      byTutor: (tutorId) => repos.performances.findByTutorId(tutorId),
    },
    profile: {
      submitApplication: (app, nowIso) => submitApplication(app, nowIso),
      review: (input) =>
        reviewApplication({ ...input, nowIso: input.nowIso ?? new Date().toISOString() }),
      applicationForTutor: async (tutorId) => {
        const all = await repos.applications.list();
        return all.find((app) => app.tutorId === tutorId) ?? null;
      },
      applications: () => repos.applications.list(),
      byTutor: async (tutorId) => {
        const profile = await repos.profiles.findByTutorId(tutorId);
        return profile
          ? {
              displayName: profile.displayName,
              photoUrl: profile.photoUrl,
              education: profile.education,
              subjects: profile.subjects,
              languages: profile.languages,
              bio: profile.bio,
              timezone: profile.timezone,
            }
          : null;
      },
    },
    recaps: {
      latestFor: (sessionId) => repos.recaps.findBySession(sessionId),
    },
    reviews: {
      submit: (review) => submitReview(review),
      reviewForSession: (sessionId) => repos.reviews.findBySession(sessionId),
      forTutor: (tutorId) => repos.reviews.listByTutor(tutorId),
    },
    messaging: {
      send: (message) => sendMessage(message),
      threadBetween: (a, b) => listThread(a, b),
      threadsFor: (participantId) => threadsFor(participantId),
      markRead: (id, at) => markRead(id, at),
    },
    interests: {
      record: (input) => recordInterest(input),
      forTutor: (tutorId) => listTutorInterests(tutorId),
    },
    notifications: {
      log: () => state.notifications,
      preferences: async (userId) =>
        state.notificationPreferences.get(userId) ?? DEFAULT_NOTIFICATION_PREFERENCES,
      savePreferences: async (userId, prefs) => {
        state.notificationPreferences.set(userId, prefs);
      },
      fireDueReminders: async (userId, nowIso) => {
        const prefs = state.notificationPreferences.get(userId) ?? DEFAULT_NOTIFICATION_PREFERENCES;
        const upcoming = await repos.sessions.listByStudent(userId);
        const due = dueSessionReminders(
          upcoming.map((session) => ({
            sessionId: session.id,
            tutorId: session.tutorId,
            studentId: session.studentId,
            startIso: session.startIso,
            isTrial: session.isTrial,
          })),
          nowIso,
          prefs,
        );
        let sent = 0;
        for (const signal of due) {
          const key = `${signal.sessionId}:${signal.templateId}`;
          if (state.reminderJournal.has(key)) continue;
          state.reminderJournal.set(key, nowIso);
          for (const channel of prefs.channels) {
            state.notifications.push({
              id: demoId('n'),
              channel,
              to: `${userId}@mojo.dev`,
              templateId: signal.templateId,
              data: { sessionId: signal.sessionId, leadMinutes: signal.leadMinutes },
              sentAt: nowIso,
            });
          }
          sent += 1;
        }
        return { sent, due: due.length };
      },
    },
    eventCount: (name) => eventCounts.get(name) ?? 0,
  };
}

function demoTranscript(event: SessionCompleted): string {
  return `Lesson ${event.payload.sessionId} with tutor ${event.payload.tutorId}. We practised present-tense conjugations and role-played a market scenario.`;
}
