import { type DemoState, seedDemoApplications } from '@mojo/demo-state';
import type { User } from '@mojo/identity/domain';
import { bcryptPasswordHasher } from '@mojo/identity/infrastructure';
import type { Message } from '@mojo/messaging/domain';
import type { ReferralLink } from '@mojo/referrals/domain';
import type {
  AvailabilityRule,
  ScheduledSession,
  SchedulingSettings,
} from '@mojo/scheduling/domain';
import type { TutorPerformance } from '@mojo/tutor-performance/domain';
import type { TutorProfile } from '@mojo/tutor-profile/domain';

const DEFAULT_PASSWORD = 'Password123';

function isoAt(dayOffset: number, hour: number, minute: number): string {
  const d = new Date(Date.now());
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Seeds the in-memory demo state only — the `USE_PRISMA` path relies on
 * `prisma migrate` + a real seed, not this file.
 */
export async function seedDemo(state: DemoState): Promise<void> {
  const passwordHash = await bcryptPasswordHasher.hash(DEFAULT_PASSWORD);

  seedDemoApplications(state);

  const users: User[] = [
    {
      id: 'u_admin',
      name: 'Mojo Admin',
      email: 'admin@mojo.dev',
      role: 'admin',
      passwordHash,
      timezone: 'Africa/Lagos',
      locale: 'en-NG',
      suspendedAt: null,
      createdAt: daysAgoIso(400),
    },
    {
      id: 't_1',
      name: 'Kelechi O.',
      email: 'tutor@mojo.dev',
      role: 'tutor',
      passwordHash,
      timezone: 'Africa/Lagos',
      locale: 'en-NG',
      suspendedAt: null,
      createdAt: daysAgoIso(350),
    },
    {
      id: 't_2',
      name: 'Ifeoma A.',
      email: 'ifeoma@mojo.dev',
      role: 'tutor',
      passwordHash,
      timezone: 'Africa/Lagos',
      locale: 'en-NG',
      suspendedAt: null,
      createdAt: daysAgoIso(300),
    },
    {
      id: 't_3',
      name: 'Tunde M.',
      email: 'tunde@mojo.dev',
      role: 'tutor',
      passwordHash,
      timezone: 'Africa/Lagos',
      locale: 'en-NG',
      suspendedAt: null,
      createdAt: daysAgoIso(210),
    },
    {
      id: 'st_1',
      name: 'Ada Obi',
      email: 'student@mojo.dev',
      role: 'student',
      passwordHash,
      timezone: 'Africa/Lagos',
      locale: 'en-NG',
      suspendedAt: null,
      createdAt: daysAgoIso(180),
    },
  ];
  for (const user of users) state.users.set(user.id, user);

  const defaultSettings: SchedulingSettings = {
    tutorId: '',
    timezone: 'Africa/Lagos',
    bufferMinutes: 15,
    minimumNoticeMinutes: 60,
    pausedForNewBookings: false,
  };
  for (const tutorId of ['t_1', 't_2', 't_3']) {
    state.schedulingSettings.set(tutorId, { ...defaultSettings, tutorId });
  }

  const ruleTemplates: Omit<AvailabilityRule, 'id' | 'tutorId'>[] = [
    { weekday: 1, startMinute: 8 * 60, endMinute: 17 * 60 },
    { weekday: 2, startMinute: 8 * 60, endMinute: 17 * 60 },
    { weekday: 3, startMinute: 8 * 60, endMinute: 17 * 60 },
    { weekday: 4, startMinute: 8 * 60, endMinute: 17 * 60 },
    { weekday: 5, startMinute: 8 * 60, endMinute: 15 * 60 },
    { weekday: 6, startMinute: 9 * 60, endMinute: 13 * 60 },
  ];
  for (const [index, tutorId] of ['t_1', 't_2', 't_3'].entries()) {
    state.availabilityRules.set(
      tutorId,
      ruleTemplates
        .slice(0, 4 + index)
        .map((rule, i) => ({ id: `rule_${tutorId}_${i}`, tutorId, ...rule })),
    );
  }

  const sessions: ScheduledSession[] = [
    {
      id: 's_1',
      tutorId: 't_1',
      studentId: 'st_1',
      startIso: isoAt(0, 9, 0),
      endIso: isoAt(0, 10, 0),
      status: 'booked',
      isTrial: true,
      statusHistory: [{ status: 'booked', at: isoAt(-2, 10, 0) }],
    },
    {
      id: 's_2',
      tutorId: 't_1',
      studentId: 'st_1',
      startIso: isoAt(0, 12, 0),
      endIso: isoAt(0, 13, 0),
      status: 'completed',
      isTrial: false,
      statusHistory: [
        { status: 'booked', at: isoAt(-6, 9, 0) },
        { status: 'completed', at: isoAt(0, 13, 30) },
      ],
    },
    {
      id: 's_3',
      tutorId: 't_2',
      studentId: 'st_1',
      startIso: isoAt(0, 10, 30),
      endIso: isoAt(0, 11, 0),
      status: 'confirmed',
      isTrial: false,
      statusHistory: [
        { status: 'booked', at: isoAt(-3, 8, 0) },
        { status: 'confirmed', at: isoAt(-3, 8, 10) },
      ],
    },
    {
      id: 's_4',
      tutorId: 't_1',
      studentId: 'st_1',
      startIso: isoAt(1, 9, 0),
      endIso: isoAt(1, 10, 0),
      status: 'booked',
      isTrial: false,
      statusHistory: [{ status: 'booked', at: isoAt(-1, 14, 0) }],
    },
  ];
  for (const session of sessions) state.sessions.set(session.id, session);

  const performances: TutorPerformance[] = [
    {
      tutorId: 't_1',
      level: 'established',
      cumulativeHoursTaught: 60,
      responseTimeMinutesAvg: 90,
      trialToPaidConversionRate: 0.35,
      cancellationRate: 0.05,
      averageRating: 4.6,
    },
    {
      tutorId: 't_2',
      level: 'expert',
      cumulativeHoursTaught: 230,
      responseTimeMinutesAvg: 45,
      trialToPaidConversionRate: 0.5,
      cancellationRate: 0.02,
      averageRating: 4.8,
    },
    {
      tutorId: 't_3',
      level: 'entry',
      cumulativeHoursTaught: 18,
      responseTimeMinutesAvg: 120,
      trialToPaidConversionRate: 0.2,
      cancellationRate: 0.1,
      averageRating: 4.2,
    },
  ];
  for (const perf of performances) state.performances.set(perf.tutorId, perf);

  state.mojoPlus.set('t_2', {
    tutorId: 't_2',
    status: 'active',
    customSegmentRateMinor: 750_000,
    subscribedAt: daysAgoIso(90),
    cancelledAt: null,
  });

  const profiles: TutorProfile[] = [
    {
      tutorId: 't_1',
      displayName: 'Kelechi O.',
      photoUrl: '',
      education: 'B.A. Modern Languages — UNIBEN',
      subjects: ['Spanish'],
      languages: ['English', 'Spanish'],
      bio: 'DELE-certified Spanish tutor, conversation-first.',
      introVideoUrl: '',
      timezone: 'Africa/Lagos',
      moderationFlagged: false,
    },
    {
      tutorId: 't_2',
      displayName: 'Ifeoma A.',
      photoUrl: '',
      education: 'M.A. French Linguistics — Université de Lyon',
      subjects: ['French', 'English'],
      languages: ['English', 'French'],
      bio: 'Expat-friendly French and English coaching.',
      introVideoUrl: '',
      timezone: 'Africa/Lagos',
      moderationFlagged: false,
    },
    {
      tutorId: 't_3',
      displayName: 'Tunde M.',
      photoUrl: '',
      education: 'B.Sc. Mathematics — UI Ibadan',
      subjects: ['Maths'],
      languages: ['English'],
      bio: 'Maths tutor for secondary and JAMB prep.',
      introVideoUrl: '',
      timezone: 'Africa/Lagos',
      moderationFlagged: false,
    },
  ];
  for (const profile of profiles) state.profiles.set(profile.tutorId, profile);

  state.walletBalancesMinor.set('t_1', 4_500_000);
  state.walletBalancesMinor.set('t_2', 12_000_000);
  state.walletBalancesMinor.set('t_3', 300_000);
  state.creditsMinor = 16_800_000;

  state.reviews.set('r_1', {
    id: 'r_1',
    sessionId: 's_2',
    tutorId: 't_1',
    studentId: 'st_1',
    rating: 5,
    body: 'Patient and structured.',
    flagged: false,
    createdAt: isoAt(0, 13, 35),
  });

  const referralLink: ReferralLink = { code: 'GOODSTART', ownerId: 'st_1', ownerRole: 'student' };
  state.referralLinks.set(referralLink.code, referralLink);

  const messages: Message[] = [
    {
      id: 'm_1',
      senderId: 'st_1',
      recipientId: 't_2',
      body: 'Hi Ifeoma! Quick question before we meet — can we also cover DELF A2 listening drills in Friday’s slot?',
      sentAt: isoAt(-2, 16, 0),
      readAt: isoAt(-2, 16, 30),
    },
    {
      id: 'm_2',
      senderId: 't_2',
      recipientId: 'st_1',
      body: 'Hi Ada! Happy to. I’ll bring a couple of practice listens and we can go from there.',
      sentAt: isoAt(-2, 16, 45),
      readAt: null,
    },
    {
      id: 'm_3',
      senderId: 'st_1',
      recipientId: 't_3',
      body: 'Hi Tunde! I’m looking for JAMB maths prep — what do your rates look like?',
      sentAt: isoAt(-1, 9, 20),
      readAt: null,
    },
  ];
  for (const message of messages) state.messages.set(message.id, message);
}
