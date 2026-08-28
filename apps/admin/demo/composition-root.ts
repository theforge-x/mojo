import type {
  AuditLogEntry,
  FeatureFlag,
  SubjectTaxonomyEntry,
} from '@mojo/admin-config/domain';
import { makeAppendAuditLog, makeListSubjects, makeSetFeatureFlag } from '@mojo/admin-config/application';
import type { PlatformMetrics, TutorLeaderboardEntry } from '@mojo/analytics/domain';
import { makeBuildLeaderboard, makeComputePlatformMetrics } from '@mojo/analytics/application';
import type { Review } from '@mojo/reviews/domain';
import type { TutorApplication } from '@mojo/tutor-profile/domain';
import { makeReviewApplication } from '@mojo/tutor-profile/application';
import type { Dispute } from '@mojo/trust-safety/domain';
import { makeFileDispute } from '@mojo/trust-safety/application';
import { AdminState } from './state';
import {
  InMemoryAnalyticsRepository,
  InMemoryApplicationRepository,
  InMemoryAuditLogRepository,
  InMemoryDisputeRepository,
  InMemoryFeatureFlagRepository,
  InMemoryReviewRepository,
  InMemorySubjectTaxonomyRepository,
  InMemoryTutorProfileRepository,
} from './repos';
import { seedAdmin } from './seed';

export interface AdminApp {
  readonly isDemoMode: boolean;
  readonly admin: { id: string; email: string } | null;
  applications: {
    list(): TutorApplication[];
    review(input: { applicationId: string; decision: 'approved' | 'rejected' }): Promise<TutorApplication>;
  };
  profiles: {
    byTutor(tutorId: string): Promise<{ displayName: string } | null>;
  };
  disputes: {
    list(): Dispute[];
    file(input: { sessionId: string; filedBy: string; reason: string }): Promise<void>;
  };
  analytics: {
    metrics(): Promise<PlatformMetrics>;
    leaderboard(limit?: number): Promise<TutorLeaderboardEntry[]>;
  };
  config: {
    flags(): Promise<FeatureFlag[]>;
    setFlag(flag: FeatureFlag): Promise<void>;
    subjects(): Promise<SubjectTaxonomyEntry[]>;
  };
  reviews: {
    list(): Review[];
  };
  log: {
    list(): AuditLogEntry[];
  };
}

let adminInstance: AdminApp | null = null;

export function getAdmin(): AdminApp {
  if (adminInstance) return adminInstance;

  const isDemoMode = process.env.USE_PRISMA !== 'true';
  const state = new AdminState();
  if (isDemoMode) seedAdmin(state);

  const applications = new InMemoryApplicationRepository(state);
  const profiles = new InMemoryTutorProfileRepository(state);
  const disputes = new InMemoryDisputeRepository(state);
  const analytics = new InMemoryAnalyticsRepository(state);
  const flags = new InMemoryFeatureFlagRepository(state);
  const logRepo = new InMemoryAuditLogRepository(state);
  const taxonomy = new InMemorySubjectTaxonomyRepository(state);
  const reviews = new InMemoryReviewRepository(state);

  const reviewApplication = makeReviewApplication({ applications, profiles });
  const fileDispute = makeFileDispute({ disputes });
  const computePlatformMetrics = makeComputePlatformMetrics({ analytics });
  const buildLeaderboard = makeBuildLeaderboard({ analytics });
  const setFeatureFlag = makeSetFeatureFlag({ flags });
  const appendAuditLog = makeAppendAuditLog({ logs: logRepo });
  const listSubjects = makeListSubjects({ taxonomy });

  const audit = (action: string, targetId: string | null) => {
    appendAuditLog({
      id: `log_${crypto.randomUUID().slice(0, 8)}`,
      adminId: 'u_admin',
      action,
      targetId,
      at: new Date().toISOString(),
    });
  };

  const app: AdminApp = {
    isDemoMode,
    admin: state.users.get('u_admin') ?? null,
    applications: {
      list: () => applications.list(),
      review: async ({ applicationId, decision }) => {
        const updated = await reviewApplication({ applicationId, decision, nowIso: new Date().toISOString() });
        audit(`application.${decision}`, applicationId);
        return updated;
      },
    },
    profiles: {
      byTutor: async (tutorId) => {
        const profile = await profiles.findByTutorId(tutorId);
        return profile ? { displayName: profile.displayName } : null;
      },
    },
    disputes: {
      list: () => disputes.list(),
      file: async ({ sessionId, filedBy, reason }) => {
        await fileDispute({
          id: `d_${crypto.randomUUID().slice(0, 8)}`,
          sessionId,
          filedBy,
          reason,
          status: 'open',
          filedAt: new Date().toISOString(),
          resolvedAt: null,
        });
        audit('dispute.filed', sessionId);
      },
    },
    analytics: {
      metrics: () => computePlatformMetrics(new Date().toISOString()),
      leaderboard: (limit = 5) => buildLeaderboard(limit),
    },
    config: {
      flags: () => flags.list(),
      setFlag: async (flag) => {
        await setFeatureFlag(flag);
        audit('feature_flag.toggled', flag.key);
      },
      subjects: () => listSubjects(),
    },
    reviews: {
      list: () => reviews.list(),
    },
    log: {
      list: () => logRepo.list(),
    },
  };

  adminInstance = app;
  return app;
}

export function resetAdminForTests(): void {
  adminInstance = null;
}