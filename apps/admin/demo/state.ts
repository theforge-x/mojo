import type { AuditLogEntry, FeatureFlag, SubjectTaxonomyEntry } from '@mojo/admin-config/domain';
import type { Review } from '@mojo/reviews/domain';
import type { ScheduledSession } from '@mojo/scheduling/domain';
import type { TutorApplication, TutorProfile } from '@mojo/tutor-profile/domain';
import type { Dispute } from '@mojo/trust-safety/domain';

export interface AdminUser {
  readonly id: string;
  readonly email: string;
  readonly role: 'admin';
}

/** In-memory backing for the admin composition root (demo mode). */
export class AdminState {
  readonly users = new Map<string, AdminUser>();
  readonly profiles = new Map<string, TutorProfile>();
  readonly applications = new Map<string, TutorApplication>();
  readonly disputes = new Map<string, Dispute>();
  readonly featureFlags = new Map<string, FeatureFlag>();
  readonly auditLog: AuditLogEntry[] = [];
  readonly subjects: SubjectTaxonomyEntry[] = [];
  readonly reviews = new Map<string, Review>();
  readonly sessions = new Map<string, ScheduledSession>();
  walletCreditsMinor = 0;
}

export function adminId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}