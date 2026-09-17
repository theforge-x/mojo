import {
  makeAppendAuditLog,
  makeListSubjects,
  makeRemoveTaxonomyEntry,
  makeSaveTaxonomyEntry,
  makeSetFeatureFlag,
  makeSetTaxonomyActive,
  type SaveTaxonomyEntryInput,
} from '@mojo/admin-config/application';
import type { AuditLogEntry, FeatureFlag, SubjectTaxonomyEntry } from '@mojo/admin-config/domain';
import { makeBuildLeaderboard, makeComputePlatformMetrics } from '@mojo/analytics/application';
import type { PlatformMetrics, TutorLeaderboardEntry } from '@mojo/analytics/domain';
import { clearSharedDemoState, sharedDemoState } from '@mojo/demo-state';
import type { Review } from '@mojo/reviews/domain';
import { makeFileDispute, makeResolveDispute } from '@mojo/trust-safety/application';
import type { Dispute } from '@mojo/trust-safety/domain';
import { makeReviewApplication } from '@mojo/tutor-profile/application';
import type {
  ApplicationRepository,
  TutorApplication,
  TutorProfileRepository,
} from '@mojo/tutor-profile/domain';
import { sharedAdminPrismaClient } from './prisma-client';
import {
  PrismaAnalyticsRepository,
  PrismaApplicationRepository,
  PrismaAuditLogRepository,
  PrismaDisputeRepository,
  PrismaFeatureFlagRepository,
  PrismaReviewRepository,
  PrismaSubjectTaxonomyRepository,
  PrismaTutorProfileRepository,
} from './prisma-repos';
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
      decision: 'approved' | 'rejected' | 'in_review';
      note?: string;
    }): Promise<TutorApplication>;
  };
  profiles: {
    byTutor(tutorId: string): Promise<{ displayName: string } | null>;
  };
  disputes: {
    list(): Promise<Dispute[]>;
    file(input: { sessionId: string; filedBy: string; reason: string }): Promise<void>;
    resolve(input: { disputeId: string; outcome: 'upheld' | 'dismissed' }): Promise<void>;
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
  catalog: {
    list(): Promise<SubjectTaxonomyEntry[]>;
    save(entry: SaveTaxonomyEntryInput): Promise<SubjectTaxonomyEntry>;
    setActive(id: string, active: boolean): Promise<SubjectTaxonomyEntry>;
    remove(id: string): Promise<void>;
  };
  reviews: {
    list(): Promise<Review[]>;
  };
  log: {
    list(): Promise<AuditLogEntry[]>;
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
  const prisma = isDemoMode ? null : sharedAdminPrismaClient();
  const disputes = prisma
    ? new PrismaDisputeRepository(prisma)
    : new InMemoryDisputeRepository(state);
  const analytics = prisma
    ? new PrismaAnalyticsRepository(prisma)
    : new InMemoryAnalyticsRepository(state);
  const flags = prisma
    ? new PrismaFeatureFlagRepository(prisma)
    : new InMemoryFeatureFlagRepository(state);
  const logRepo = prisma
    ? new PrismaAuditLogRepository(prisma)
    : new InMemoryAuditLogRepository(state);
  const taxonomy = prisma
    ? new PrismaSubjectTaxonomyRepository(prisma)
    : new InMemorySubjectTaxonomyRepository(state);
  const reviews = prisma ? new PrismaReviewRepository(prisma) : new InMemoryReviewRepository(state);

  const reviewApplication = makeReviewApplication({ applications, profiles });
  const fileDispute = makeFileDispute({ disputes });
  const resolveDispute = makeResolveDispute({ disputes });
  const computePlatformMetrics = makeComputePlatformMetrics({ analytics });
  const buildLeaderboard = makeBuildLeaderboard({ analytics });
  const setFeatureFlag = makeSetFeatureFlag({ flags });
  const appendAuditLog = makeAppendAuditLog({ logs: logRepo });
  const listSubjects = makeListSubjects({ taxonomy });
  const saveTaxonomyEntry = makeSaveTaxonomyEntry({ taxonomy });
  const setTaxonomyActive = makeSetTaxonomyActive({ taxonomy });
  const removeTaxonomyEntry = makeRemoveTaxonomyEntry({ taxonomy });

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
  // target the same database. Defaults to the README's hub dev port so the demo
  // works out of the box; an explicit `HUB_URL` overrides it. An empty override
  // (tests, or a deliberately standalone admin) falls back to the local store.
  const hubBaseUrl = isDemoMode
    ? (process.env.HUB_URL === undefined ? 'http://localhost:3003' : process.env.HUB_URL).replace(
        /\/$/,
        '',
      )
    : '';
  const bridgeSecret =
    process.env.INTERNAL_BRIDGE_SECRET ?? (isDemoMode ? 'demo-bridge-dev-only' : '');
  const bridgeHeaders = bridgeSecret ? { 'x-mojo-bridge': bridgeSecret } : undefined;

  const app: AdminApp = {
    isDemoMode,
    admin: state.users.get('u_admin') ?? null,
    applications: {
      list: async () => {
        if (!hubBaseUrl) return applications.list();
        // The hub is the system of record for applications in the demo loop —
        // the admin list is whatever the hub has. Falls back to the shared
        // store when the hub isn't running so the admin app stays usable.
        const fallback = () => applications.list();
        try {
          const response = await fetch(`${hubBaseUrl}/api/applications`, {
            headers: bridgeHeaders,
            signal: AbortSignal.timeout(5000),
          });
          if (!response.ok) return fallback();
          const data = (await response.json()) as { applications?: unknown };
          if (!Array.isArray(data.applications)) return fallback();
          return data.applications as TutorApplication[];
        } catch {
          return fallback();
        }
      },
      review: async ({ applicationId, decision, note }) => {
        if (!hubBaseUrl) {
          const updated = await reviewApplication({
            applicationId,
            decision,
            note,
            nowIso: new Date().toISOString(),
          });
          audit(`application.${decision}`, applicationId);
          return updated;
        }
        let response: Response;
        try {
          response = await fetch(`${hubBaseUrl}/api/applications/${applicationId}/review`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...bridgeHeaders },
            body: JSON.stringify({ decision, note }),
            signal: AbortSignal.timeout(5000),
          });
        } catch {
          // Hub unreachable — fall back to the shared store so the admin app
          // stays usable in the demo. Hub rejections (!ok) below never fall
          // back: writing locally after the hub refused would double-apply.
          const updated = await reviewApplication({
            applicationId,
            note,
            decision,
            nowIso: new Date().toISOString(),
          });
          audit(`application.${decision}`, applicationId);
          return updated;
        }
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            typeof (data as { error?: unknown })?.error === 'string'
              ? (data as { error: string }).error
              : 'The hub rejected this review.',
          );
        }
        audit(`application.${decision}`, applicationId);
        return (data as { application: TutorApplication }).application;
      },
    },
    profiles: {
      byTutor: async (tutorId) => {
        const profile = await profiles.findByTutorId(tutorId);
        return profile ? { displayName: profile.displayName } : null;
      },
    },
    disputes: {
      list: async () => disputes.list(),
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
      resolve: async ({ disputeId, outcome }) => {
        await resolveDispute({ disputeId, outcome, nowIso: new Date().toISOString() });
        audit(`dispute.${outcome}`, disputeId);
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
    catalog: {
      list: async () => {
        // The hub owns the catalogue in the demo loop — the admin list is
        // whatever the hub has, with the same bridge-then-local-fallback
        // shape as the application queue.
        if (!hubBaseUrl) return taxonomy.list();
        try {
          const response = await fetch(`${hubBaseUrl}/api/admin/catalog`, {
            headers: bridgeHeaders,
            signal: AbortSignal.timeout(5000),
          });
          if (!response.ok) return taxonomy.list();
          const data = (await response.json()) as { entries?: unknown };
          if (!Array.isArray(data.entries)) return taxonomy.list();
          return data.entries as SubjectTaxonomyEntry[];
        } catch {
          return taxonomy.list();
        }
      },
      save: async (entry) => {
        const fallback = async () => {
          const saved = await saveTaxonomyEntry(entry);
          audit('catalog.save', saved.id);
          return saved;
        };
        if (!hubBaseUrl) return fallback();
        let response: Response;
        try {
          response = await fetch(`${hubBaseUrl}/api/admin/catalog`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...bridgeHeaders },
            body: JSON.stringify(entry),
            signal: AbortSignal.timeout(5000),
          });
        } catch {
          return fallback();
        }
        const data = (await response.json().catch(() => ({}))) as {
          entry?: SubjectTaxonomyEntry;
          error?: unknown;
        };
        // Hub rejections (!ok) never fall back: writing locally after the hub
        // refused would double-apply.
        if (!response.ok || !data.entry) {
          throw new Error(
            typeof data.error === 'string' ? data.error : 'The hub rejected this change.',
          );
        }
        audit('catalog.save', data.entry.id);
        return data.entry;
      },
      setActive: async (id, active) => {
        const fallback = async () => {
          const updated = await setTaxonomyActive({ id, active });
          audit('catalog.active', id);
          return updated;
        };
        if (!hubBaseUrl) return fallback();
        let response: Response;
        try {
          response = await fetch(`${hubBaseUrl}/api/admin/catalog`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json', ...bridgeHeaders },
            body: JSON.stringify({ id, active }),
            signal: AbortSignal.timeout(5000),
          });
        } catch {
          return fallback();
        }
        const data = (await response.json().catch(() => ({}))) as {
          entry?: SubjectTaxonomyEntry;
          error?: unknown;
        };
        if (!response.ok || !data.entry) {
          throw new Error(
            typeof data.error === 'string' ? data.error : 'The hub rejected this change.',
          );
        }
        audit('catalog.active', id);
        return data.entry;
      },
      remove: async (id) => {
        const fallback = async () => {
          await removeTaxonomyEntry(id);
          audit('catalog.remove', id);
        };
        if (!hubBaseUrl) return fallback();
        let response: Response;
        try {
          response = await fetch(`${hubBaseUrl}/api/admin/catalog?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: bridgeHeaders,
            signal: AbortSignal.timeout(5000),
          });
        } catch {
          return fallback();
        }
        const data = (await response.json().catch(() => ({}))) as { error?: unknown };
        if (!response.ok) {
          throw new Error(
            typeof data.error === 'string' ? data.error : 'The hub rejected this change.',
          );
        }
        audit('catalog.remove', id);
      },
    },
    reviews: {
      list: async () => reviews.list(),
    },
    log: {
      list: async () => logRepo.list(),
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
  const prisma = sharedAdminPrismaClient();
  return {
    applications: new PrismaApplicationRepository(prisma),
    profiles: new PrismaTutorProfileRepository(prisma),
  };
}
