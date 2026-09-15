import type {
  AuditLogEntry,
  AuditLogRepository,
  FeatureFlag,
  FeatureFlagRepository,
  SubjectTaxonomyEntry,
  SubjectTaxonomyRepository,
} from '@mojo/admin-config/domain';
import type { AnalyticsRepository, LeaderboardCandidate } from '@mojo/analytics/domain';
import type { Review, ReviewRepository } from '@mojo/reviews/domain';
import type { Dispute, DisputeRepository } from '@mojo/trust-safety/domain';
import type {
  ApplicationRepository,
  TutorApplication,
  TutorProfile,
  TutorProfileRepository,
} from '@mojo/tutor-profile/domain';
import type { AdminState } from './state';

/**
 * The smallest slice one of the admin's application/profile repositories needs
 * from a backing store. Both the admin's own `AdminState` and the hub's
 * `DemoState` satisfy it — in the demo, the hub is the single system of record
 * for applications, so the admin binds against `sharedDemoState()`.
 */
export interface ApplicationProfileStore {
  readonly applications: Map<string, TutorApplication>;
  readonly profiles: Map<string, TutorProfile>;
}

export class InMemoryApplicationRepository implements ApplicationRepository {
  constructor(private readonly state: ApplicationProfileStore) {}

  async findById(applicationId: string): Promise<TutorApplication | null> {
    return this.state.applications.get(applicationId) ?? null;
  }

  async save(application: TutorApplication): Promise<void> {
    this.state.applications.set(application.id, application);
  }

  async list(): Promise<TutorApplication[]> {
    return [...this.state.applications.values()].sort((a, b) =>
      b.submittedAt.localeCompare(a.submittedAt),
    );
  }
}

export class InMemoryTutorProfileRepository implements TutorProfileRepository {
  constructor(private readonly state: ApplicationProfileStore) {}

  async findByTutorId(tutorId: string): Promise<TutorProfile | null> {
    return this.state.profiles.get(tutorId) ?? null;
  }

  async save(profile: TutorProfile): Promise<void> {
    this.state.profiles.set(profile.tutorId, profile);
  }

  list(): TutorProfile[] {
    return [...this.state.profiles.values()];
  }
}

export class InMemoryDisputeRepository implements DisputeRepository {
  constructor(private readonly state: AdminState) {}

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

  list(): Dispute[] {
    return [...this.state.disputes.values()].sort((a, b) => b.filedAt.localeCompare(a.filedAt));
  }
}

export class InMemoryReviewRepository implements ReviewRepository {
  constructor(private readonly state: AdminState) {}

  async findById(id: string): Promise<Review | null> {
    return this.state.reviews.get(id) ?? null;
  }

  async findBySession(sessionId: string): Promise<Review | null> {
    for (const review of this.state.reviews.values()) {
      if (review.sessionId === sessionId) return review;
    }
    return null;
  }

  async listByTutor(tutorId: string): Promise<Review[]> {
    return [...this.state.reviews.values()]
      .filter((r) => r.tutorId === tutorId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async save(review: Review): Promise<void> {
    this.state.reviews.set(review.id, review);
  }

  list(): Review[] {
    return [...this.state.reviews.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export class InMemoryAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly state: AdminState) {}

  async countActiveTutors(): Promise<number> {
    return this.state.profiles.size;
  }

  async countActiveStudents(): Promise<number> {
    const students = new Set<string>();
    for (const session of this.state.sessions.values()) students.add(session.studentId);
    return students.size;
  }

  async sumWalletCreditsMinor(): Promise<number> {
    return this.state.walletCreditsMinor;
  }

  async trialToPaidConversionRate(): Promise<number> {
    const trial = new Set<string>();
    const paid = new Set<string>();
    for (const session of this.state.sessions.values()) {
      if (session.isTrial) trial.add(session.studentId);
      else paid.add(session.studentId);
    }
    if (trial.size === 0) return 0;
    let converted = 0;
    for (const studentId of trial) {
      if (paid.has(studentId)) converted += 1;
    }
    return converted / trial.size;
  }

  async listLeaderboardCandidates(): Promise<LeaderboardCandidate[]> {
    const state = this.state;
    const perTutor = new Map<string, { tutorId: string; sessions: number; cancelled: number }>();
    for (const session of state.sessions.values()) {
      const entry = perTutor.get(session.tutorId) ?? {
        tutorId: session.tutorId,
        sessions: 0,
        cancelled: 0,
      };
      entry.sessions += 1;
      if (session.status === 'cancelled' || session.status === 'no_show') entry.cancelled += 1;
      perTutor.set(session.tutorId, entry);
    }
    return [...perTutor.values()].map(({ tutorId, sessions, cancelled }) => {
      const profile = state.profiles.get(tutorId);
      return {
        tutorId,
        displayName: profile?.displayName ?? tutorId,
        responseTimeMinutesAvg: 0,
        cancellationRate: sessions === 0 ? 0 : cancelled / sessions,
      };
    });
  }
}

export class InMemoryFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private readonly state: AdminState) {}

  async findByKey(key: string): Promise<FeatureFlag | null> {
    return this.state.featureFlags.get(key) ?? null;
  }

  async list(): Promise<FeatureFlag[]> {
    return [...this.state.featureFlags.values()];
  }

  async save(flag: FeatureFlag): Promise<void> {
    this.state.featureFlags.set(flag.key, flag);
  }
}

export class InMemoryAuditLogRepository implements AuditLogRepository {
  constructor(private readonly state: AdminState) {}

  async append(entry: AuditLogEntry): Promise<void> {
    this.state.auditLog.push(entry);
  }

  list(): AuditLogEntry[] {
    return [...this.state.auditLog].reverse();
  }
}

export class InMemorySubjectTaxonomyRepository implements SubjectTaxonomyRepository {
  constructor(private readonly state: AdminState) {}

  async list(): Promise<SubjectTaxonomyEntry[]> {
    return [...this.state.subjects];
  }

  async save(entry: SubjectTaxonomyEntry): Promise<void> {
    this.state.subjects.push(entry);
  }
}
