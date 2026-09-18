import { createHmac } from 'node:crypto';
import {
  makeRemoveTaxonomyEntry,
  makeSaveTaxonomyEntry,
  makeSetTaxonomyActive,
  type SaveTaxonomyEntryInput,
} from '@mojo/admin-config/application';
import {
  DEFAULT_TAXONOMY_SEED,
  type SubjectTaxonomyEntry,
  type SubjectTaxonomyRepository,
} from '@mojo/admin-config/domain';
import { makeGenerateRecap } from '@mojo/ai-learning/application';
import type { LessonRecap, RecapRepository, TranscriptSummarizer } from '@mojo/ai-learning/domain';
import {
  type AutoConfirmDeliveriesResult,
  type ConfirmDeliveryInput,
  makeAutoConfirmDeliveries,
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
import {
  makeAuthenticateUser,
  makeChangeEmail,
  makeChangePassword,
  makeDeactivateAccount,
  makeRegisterUser,
  makeUpdateDisplayName,
} from '@mojo/identity/application';
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
import {
  type ChargeStudentInput,
  type InitializeChargeInput,
  makeCaptureCharge,
  makeChargeStudent,
  makeGrantReplacement,
  makeInitializeCharge,
  makeQuoteSessionCharge,
  makeRefundCharge,
  makeReleasePayout,
  type QuoteSessionChargeInput,
  type RefundChargeInput,
  type ReleasePayoutInput,
} from '@mojo/payments/application';
import type {
  ChargeQuote,
  ChargeRefund,
  ChargeRepository,
  PaymentCollector,
  PayoutRail,
  RefundReason,
  ReplacementGrant,
  ReplacementGrantRepository,
  StudentCharge,
  StudentPaymentMethod,
  StudentPaymentMethodRepository,
  WalletRepository,
} from '@mojo/payments/domain';
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
  makeRescheduleSession,
  makeSetAvailability,
  makeSetExceptions,
  makeUpdateSchedulingSettings,
  type RescheduleSessionInput,
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
  type SessionRescheduled,
} from '@mojo/shared/events';
import { makeFileDispute } from '@mojo/trust-safety/application';
import type { Dispute, DisputeRepository } from '@mojo/trust-safety/domain';
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
  PaystackCollectAdapter,
  PaystackPayoutRail,
  PrismaApplicationRepository,
  PrismaAvailabilityRepository,
  PrismaBookingRepository,
  PrismaChargeRepository,
  PrismaDisputeRepository,
  PrismaInterestRepository,
  PrismaMessageRepository,
  PrismaMojoPlusRepository,
  PrismaPaymentMethodRepository,
  PrismaRecapRepository,
  PrismaReferralRepository,
  PrismaReplacementGrantRepository,
  PrismaReviewRepository,
  PrismaSessionRepository,
  PrismaSubjectTaxonomyRepository,
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
  InMemoryChargeRepository,
  InMemoryDisputeRepository,
  InMemoryInterestRepository,
  InMemoryMessageRepository,
  InMemoryMojoPlusRepository,
  InMemoryPayoutRail,
  InMemoryRecapRepository,
  InMemoryReferralRepository,
  InMemoryReplacementGrantRepository,
  InMemoryReviewRepository,
  InMemorySessionRepository,
  InMemorySessionStore,
  InMemoryStudentPaymentMethodRepository,
  InMemorySubjectTaxonomyRepository,
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
  charges: ChargeRepository;
  methods: StudentPaymentMethodRepository;
  grants: ReplacementGrantRepository;
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
  taxonomy: SubjectTaxonomyRepository;
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
    changePassword(input: {
      userId: string;
      currentPassword: string;
      newPassword: string;
    }): Promise<void>;
    updateDisplayName(userId: string, name: string): Promise<void>;
    changeEmail(input: { userId: string; email: string; currentPassword: string }): Promise<void>;
    deactivateAccount(input: { userId: string; currentPassword: string }): Promise<void>;
  };
  scheduling: {
    sessionById(sessionId: string): Promise<ScheduledSession | null>;
    sessionsByTutor(tutorId: string): Promise<ScheduledSession[]>;
    sessionsByStudent(studentId: string): Promise<ScheduledSession[]>;
    availabilityRules(tutorId: string): Promise<AvailabilityRule[]>;
    settings(tutorId: string): Promise<SchedulingSettings>;
    book(input: BookSessionInput): Promise<ScheduledSession>;
    cancel(input: CancelSessionInput): Promise<void>;
    confirmSession(input: ConfirmSessionInput): Promise<void>;
    reschedule(input: RescheduleSessionInput): Promise<ScheduledSession>;
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
    autoConfirm(nowIso: string): Promise<AutoConfirmDeliveriesResult>;
  };
  trust: {
    file(input: { sessionId: string; filedBy: string; reason: string }): Promise<Dispute>;
    forSession(sessionId: string): Promise<Dispute | null>;
  };
  discovery: {
    search(filters: TutorSearchFilters): Promise<TutorSearchResult[]>;
  };
  wallet: {
    forTutor(tutorId: string): Promise<{ tutorId: string; balance: Money }>;
    releasePayout(input: ReleasePayoutInput): Promise<void>;
  };
  billing: {
    quote(input: QuoteSessionChargeInput): Promise<ChargeQuote>;
    defaultMethod(studentId: string): Promise<StudentPaymentMethod | null>;
    methods(studentId: string): Promise<StudentPaymentMethod[]>;
    /** Demo stub card — throws outside demo mode, where a real rail intent belongs. */
    provisionDemoMethod(studentId: string): Promise<StudentPaymentMethod>;
    charge(input: ChargeStudentInput): Promise<StudentCharge>;
    initializeCharge(
      input: InitializeChargeInput & { callbackUrl: string; nowIso: string },
    ): Promise<{ charge: StudentCharge; authorizationUrl: string }>;
    captureCharge(reference: string): Promise<StudentCharge>;
    verifyWebhookSignature(payload: string, signature: string | null): boolean;
    chargesByStudent(studentId: string): Promise<StudentCharge[]>;
    refundsByStudent(studentId: string): Promise<ChargeRefund[]>;
    refund(input: RefundChargeInput): Promise<{ refund: ChargeRefund; charge: StudentCharge }>;
    refundForSession(
      sessionId: string,
      reason: RefundReason,
      nowIso: string,
    ): Promise<ChargeRefund | null>;
    grants(studentId: string): Promise<ReplacementGrant[]>;
    grantReplacement(input: {
      studentId: string;
      tutorId: string;
      sourceSessionId: string;
    }): Promise<ReplacementGrant | null>;
  };
  performance: {
    byTutor(tutorId: string): Promise<TutorPerformance | null>;
  };
  profile: {
    submitApplication(app: TutorApplication, nowIso: string): Promise<void>;
    review(input: {
      applicationId: string;
      decision: 'approved' | 'rejected' | 'in_review';
      note?: string;
      nowIso?: string;
    }): Promise<TutorApplication>;
    /** Latest application by submittedAt — resubmits and profile updates supersede. */
    applicationForTutor(tutorId: string): Promise<TutorApplication | null>;
    applications(): Promise<TutorApplication[]>;
    byTutor(tutorId: string): Promise<{
      displayName: string;
      photoUrl: string;
      education: string;
      subjects: readonly string[];
      languages: readonly string[];
      bio: string;
      introVideoUrl: string;
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
    /** Sweep every active student — the cron entrypoint. Never throws per-user. */
    fireAllDueReminders(nowIso: string): Promise<{ users: number; sent: number; due: number }>;
  };
  catalog: {
    /** Full taxonomy (including inactive) — admin management over the bridge. */
    list(): Promise<SubjectTaxonomyEntry[]>;
    /** Active domains with their active subjects, for search filters and apply. */
    options(): Promise<{ domain: string; subjects: string[] }[]>;
    save(entry: SaveTaxonomyEntryInput): Promise<SubjectTaxonomyEntry>;
    setActive(id: string, active: boolean): Promise<SubjectTaxonomyEntry>;
    remove(id: string): Promise<void>;
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
  if (isDemoMode) {
    // Synchronous so catalogue reads never race the async demo seed — tutor
    // search and filters must see subjects on the very first request.
    if (state.taxonomy.length === 0) {
      for (const entry of DEFAULT_TAXONOMY_SEED) state.taxonomy.push({ ...entry });
    }
    if (!state.seedReady) {
      state.seedReady = seedDemo(state);
    }
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
    charges: new InMemoryChargeRepository(state),
    methods: new InMemoryStudentPaymentMethodRepository(state),
    grants: new InMemoryReplacementGrantRepository(state),
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
    taxonomy: new InMemorySubjectTaxonomyRepository(state),
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
    charges: new PrismaChargeRepository(prisma),
    methods: new PrismaPaymentMethodRepository(prisma),
    grants: new PrismaReplacementGrantRepository(prisma),
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
    taxonomy: new PrismaSubjectTaxonomyRepository(prisma),
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
  const changePassword = makeChangePassword({ users: repos.users, hasher: bcryptPasswordHasher });
  const updateDisplayName = makeUpdateDisplayName({ users: repos.users });
  const changeEmail = makeChangeEmail({ users: repos.users, hasher: bcryptPasswordHasher });
  const deactivateAccount = makeDeactivateAccount({
    users: repos.users,
    hasher: bcryptPasswordHasher,
  });
  const bookSession = makeBookSession({
    availability: repos.availability,
    sessions: repos.sessions,
  });
  const cancelSession = makeCancelSession({ sessions: repos.sessions });
  const confirmSession = makeConfirmSession({ sessions: repos.sessions });
  const rescheduleSession = makeRescheduleSession({
    availability: repos.availability,
    sessions: repos.sessions,
  });
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
  const fileDispute = makeFileDispute({ disputes: repos.disputes });
  const autoConfirmDeliveries = makeAutoConfirmDeliveries({
    listAwaitingConfirmation: (endBeforeIso) =>
      repos.bookings.listAwaitingConfirmation(endBeforeIso),
    confirmDelivery: (input) => confirmDelivery(input),
  });
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
  const quoteSessionCharge = makeQuoteSessionCharge({
    rates: repos.levels,
    defaults: DEFAULT_SEGMENT_RATE_NGN,
  });
  // Demo mode keeps the historical stub ledger (immediate success, no
  // network). Anywhere else, money moves through Paystack before a captured
  // row is ever written.
  const collect: PaymentCollector = isDemoMode
    ? {
        initialize: async (input) => ({
          authorizationUrl: `https://checkout.paystack.com/demo/${input.reference}`,
          accessCode: `demo_${input.reference}`,
          reference: input.reference,
        }),
        verify: async (reference) => {
          // The demo rail approves whatever was asked — echo the ledger row
          // so the amount check exercises the real path.
          const charge = await repos.charges.findByReference(reference);
          return {
            reference,
            status: 'success',
            amountMinor: charge?.totalMinor ?? 0,
            currency: 'NGN',
            paidAt: new Date().toISOString(),
            authorization: null,
            customerEmail: null,
          };
        },
        chargeAuthorization: async (input) => ({ reference: input.reference, status: 'success' }),
        verifyWebhookSignature: (payload, signature) => {
          // Demo mirrors the prod shape: HMAC against the configured key so
          // the 401 path stays exercisable without real money.
          if (!signature) return false;
          const key = process.env.PAYSTACK_SECRET_KEY || 'demo-bridge-dev-only';
          const expected = createHmac('sha512', key).update(payload).digest('hex');
          return expected === signature;
        },
      }
    : new PaystackCollectAdapter(process.env.PAYSTACK_SECRET_KEY ?? '');
  const chargeStudent = makeChargeStudent({
    charges: repos.charges,
    methods: repos.methods,
    rates: repos.levels,
    defaults: DEFAULT_SEGMENT_RATE_NGN,
    grants: repos.grants,
    collect,
  });
  const initializeCharge = makeInitializeCharge({
    charges: repos.charges,
    rates: repos.levels,
    defaults: DEFAULT_SEGMENT_RATE_NGN,
    collect,
  });
  const captureCharge = makeCaptureCharge({
    charges: repos.charges,
    methods: repos.methods,
    collect,
  });
  const grantReplacement = makeGrantReplacement({ grants: repos.grants });
  const refundCharge = makeRefundCharge({ charges: repos.charges });
  const dispatchNotification = makeDispatchNotification({ dispatchers: repos.notifications });
  const sendMessage = makeSendMessage({ messages: repos.messages });
  const listThread = makeListThread({ messages: repos.messages });
  const threadsFor = makeThreadsFor({ messages: repos.messages });
  const markRead = makeMarkRead({ messages: repos.messages });
  const recordInterest = makeRecordInterest({ interests: repos.interests });
  const saveTaxonomyEntry = makeSaveTaxonomyEntry({ taxonomy: repos.taxonomy });
  const setTaxonomyActive = makeSetTaxonomyActive({ taxonomy: repos.taxonomy });
  const removeTaxonomyEntry = makeRemoveTaxonomyEntry({ taxonomy: repos.taxonomy });
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

  const fireDueFor = async (
    userId: string,
    nowIso: string,
  ): Promise<{ sent: number; due: number }> => {
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
  eventBus.subscribe('SessionRescheduled', (event: SessionRescheduled) => {
    count('SessionRescheduled');
    safeNotify('email', 'student@mojo.dev', 'session-rescheduled-confirmation', event.payload);
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
      changePassword: (input) => changePassword(input),
      updateDisplayName: (userId, name) => updateDisplayName({ userId, name }),
      changeEmail: (input) => changeEmail(input),
      deactivateAccount: (input) =>
        deactivateAccount({ ...input, nowIso: new Date().toISOString() }),
    },
    scheduling: {
      sessionById: (sessionId) => repos.sessions.findById(sessionId),
      sessionsByTutor: (tutorId) => repos.sessions.listByTutor(tutorId),
      sessionsByStudent: (studentId) => repos.sessions.listByStudent(studentId),
      availabilityRules: (tutorId) => repos.availability.getRules(tutorId),
      settings: (tutorId) => repos.availability.getSettings(tutorId),
      book: (input) => bookSession(input),
      cancel: (input) => cancelSession(input),
      confirmSession: (input) => confirmSession(input),
      reschedule: (input) => rescheduleSession(input),
      saveAvailability: (tutorId, rules) => setAvailability(tutorId, rules),
      updateSettings: (input) => updateSchedulingSettings(input),
      exceptions: (tutorId, fromDate, toDate) =>
        repos.availability.listExceptions(tutorId, fromDate, toDate),
      saveExceptions: (tutorId, date, exceptions) => setExceptions({ tutorId, date, exceptions }),
    },
    booking: {
      confirmDelivery: (input) => confirmDelivery(input),
      markNoShow: (sessionId, by, nowIso) => markNoShow({ sessionId, by, nowIso }),
      autoConfirm: (nowIso) => autoConfirmDeliveries({ nowIso }),
    },
    trust: {
      file: async ({ sessionId, filedBy, reason }) => {
        const dispute: Dispute = {
          id: `d_${crypto.randomUUID().slice(0, 8)}`,
          sessionId,
          filedBy,
          reason,
          status: 'open',
          filedAt: new Date().toISOString(),
          resolvedAt: null,
        };
        await fileDispute(dispute);
        return dispute;
      },
      forSession: (sessionId) => repos.disputes.findBySession(sessionId),
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
    billing: {
      quote: (input) => quoteSessionCharge(input),
      defaultMethod: (studentId) => repos.methods.findDefault(studentId),
      methods: (studentId) => repos.methods.findByStudent(studentId),
      provisionDemoMethod: async (studentId) => {
        if (!isDemoMode) {
          throw new Error('Add a Paystack or Flutterwave card to book.');
        }
        const method: StudentPaymentMethod = {
          id: crypto.randomUUID(),
          studentId,
          rail: 'paystack',
          last4: '0000',
          authorizationCode: null,
          isDefault: true,
        };
        await repos.methods.save(method);
        return method;
      },
      charge: (input) => chargeStudent(input),
      initializeCharge: (input) => initializeCharge(input),
      captureCharge: (reference) => captureCharge({ reference, nowIso: new Date().toISOString() }),
      verifyWebhookSignature: (payload, signature) =>
        collect.verifyWebhookSignature(payload, signature),
      chargesByStudent: (studentId) => repos.charges.listByStudent(studentId),
      refundsByStudent: (studentId) => repos.charges.listRefundsByStudent(studentId),
      refund: (input) => refundCharge(input),
      refundForSession: async (sessionId, reason, nowIso) => {
        const charge = await repos.charges.findBySession(sessionId);
        if (!charge || charge.status === 'refunded' || charge.status === 'failed') return null;
        if (charge.status === 'pending') {
          // Nothing moved yet — void the row instead of refunding, and report
          // no refund so callers don't bank a replacement for unpaid money.
          await repos.charges.save({ ...charge, status: 'failed' });
          return null;
        }
        const { refund } = await refundCharge({
          chargeId: charge.id,
          studentId: charge.studentId,
          reason,
          nowIso,
        });
        return refund;
      },
      grants: (studentId) => repos.grants.listByStudent(studentId),
      grantReplacement: (input) => grantReplacement({ ...input, nowIso: new Date().toISOString() }),
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
        const mine = all.filter((app) => app.tutorId === tutorId);
        mine.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
        return mine[0] ?? null;
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
              introVideoUrl: profile.introVideoUrl,
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
    catalog: {
      list: () => repos.taxonomy.list(),
      options: async () => {
        const entries = await repos.taxonomy.list();
        return entries
          .filter((e) => e.parentId === null && e.active)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((domain) => ({
            domain: domain.name,
            subjects: entries
              .filter((e) => e.parentId === domain.id && e.active)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((e) => e.name),
          }))
          .filter((group) => group.subjects.length > 0);
      },
      save: (entry) => saveTaxonomyEntry(entry),
      setActive: (id, active) => setTaxonomyActive({ id, active }),
      remove: (id) => removeTaxonomyEntry(id),
    },
    notifications: {
      log: () => state.notifications,
      preferences: async (userId) =>
        state.notificationPreferences.get(userId) ?? DEFAULT_NOTIFICATION_PREFERENCES,
      savePreferences: async (userId, prefs) => {
        state.notificationPreferences.set(userId, prefs);
      },
      fireDueReminders: (userId, nowIso) => fireDueFor(userId, nowIso),
      fireAllDueReminders: async (nowIso) => {
        const students = await repos.users.listByRole('student');
        let users = 0;
        let sent = 0;
        let due = 0;
        for (const student of students) {
          if (student.suspendedAt) continue;
          users += 1;
          try {
            const fired = await fireDueFor(student.id, nowIso);
            sent += fired.sent;
            due += fired.due;
          } catch {
            // One student's failure must not stall everyone else's reminders.
          }
        }
        return { users, sent, due };
      },
    },
    eventCount: (name) => eventCounts.get(name) ?? 0,
  };
}

function demoTranscript(event: SessionCompleted): string {
  return `Lesson ${event.payload.sessionId} with tutor ${event.payload.tutorId}. We practised present-tense conjugations and role-played a market scenario.`;
}
