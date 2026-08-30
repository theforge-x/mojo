import {
  makeAppendAuditLog,
  makeListSubjects,
  makeSetFeatureFlag,
} from '@mojo/admin-config/application';
import type { AuditLogEntry, FeatureFlag, SubjectTaxonomyEntry } from '@mojo/admin-config/domain';
import { makeBuildLeaderboard, makeComputePlatformMetrics } from '@mojo/analytics/application';
import type { PlatformMetrics, TutorLeaderboardEntry } from '@mojo/analytics/domain';
import { clearSharedDemoState, sharedDemoState } from '@mojo/demo-state';
import type { Review } from '@mojo/reviews/domain';
import { makeFileDispute } from '@mojo/trust-safety/application';
import type { Dispute } from '@mojo/trust-safety/domain';
import { makeReviewApplication } from '@mojo/tutor-profile/application';
import type {
  ApplicationRepository,
  TutorApplication,
  TutorProfileRepository,
} from '@mojo/tutor-profile/domain';
import { PrismaClient } from '@prisma/client';
import { PrismaApplicationRepository, PrismaTutorProfileRepository } from './prisma-repos';
import {
  type ApplicationProfileStore,
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
import { clearSharedAdminState, sharedAdminState } from './state';

export interface AdminApp {
  readonly isDemoMode: boolean;
  readonly admin: { id: string; email: string } | null;
  applications: {
    list(): Promise<TutorApplication[]>;
    review(input: {
      applicationId: string;
      decision: 'approved' | 'rejected';
    }): Promise<TutorApplication>;
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
  const state = sharedAdminState();
  // The demo's single shared `DemoState` — the hub's in-memory application and
  // profile maps. Approving here writes the exact maps the hub reads.
  const shared = sharedDemoState();
  if (isDemoMode && !state.seeded) {
    seedAdmin(state, shared);
    state.seeded = true;
  }

  const { applications, profiles } = buildApplicationProfileRepos(isDemoMode, shared);
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

  // Cross-process demo bridge only: dev runs the hub and admin as two servers,
  // so a same-process `DemoState` can't be shared. The hub stays the system of
  // record over `HUB_URL`; the Prisma path needs no bridge because both apps
  // target the same database.
  const hubBaseUrl = isDemoMode ? (process.env.HUB_URL ?? '').replace(/\/$/, '') : '';

  const app: AdminApp = {
    isDemoMode,
    admin: state.users.get('u_admin') ?? null,
    applications: {
      list: () => {
        if (!hubBaseUrl) return applications.list();
        // The hub is the system of record for applications in the demo loop —
        // the admin list is whatever the hub has. Falls back to the shared
        // store when the hub isn't running so the admin app stays usable.
        try {
          return fetch(`${hubBaseUrl}/api/applications`).then(async (response) => {
            if (!response.ok) return applications.list();
            const data = (await response.json()) as { applications?: unknown };
            if (!Array.isArray(data.applications)) return applications.list();
            return data.applications as TutorApplication[];
          });
        } catch {
          return applications.list();
        }
      },
      review: async ({ applicationId, decision }) => {
        if (!hubBaseUrl) {
          const updated = await reviewApplication({
            applicationId,
            decision,
            nowIso: new Date().toISOString(),
          });
          audit(`application.${decision}`, applicationId);
          return updated;
        }
        try {
          const response = await fetch(`${hubBaseUrl}/api/applications/${applicationId}/review`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ decision }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(
              typeof data?.error === 'string' ? data.error : 'The hub rejected this review.',
            );
          }
          audit(`application.${decision}`, applicationId);
          return data.application as TutorApplication;
        } catch {
          // Fall back to the shared store when the hub is unreachable.
          const updated = await reviewApplication({
            applicationId,
            decision,
            nowIso: new Date().toISOString(),
          });
          audit(`application.${decision}`, applicationId);
          return updated;
        }
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
  clearSharedAdminState();
  // The admin demos application/profile surfaces against the hub's shared
  // store — clear it too so a test never leaks an approved application into
  // the next one.
  clearSharedDemoState();
}

function buildApplicationProfileRepos(
  isDemoMode: boolean,
  shared: ApplicationProfileStore,
): { applications: ApplicationRepository; profiles: TutorProfileRepository } {
  if (isDemoMode) {
    return {
      applications: new InMemoryApplicationRepository(shared),
      profiles: new InMemoryTutorProfileRepository(shared),
    };
  }
  const prisma = new PrismaClient();
  return {
    applications: new PrismaApplicationRepository(prisma),
    profiles: new PrismaTutorProfileRepository(prisma),
  };
}
