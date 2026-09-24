import type { AuditLogEntry, FeatureFlag, SubjectTaxonomyEntry } from '@mojo/admin-config/domain';
import type { Review } from '@mojo/reviews/domain';
import type { ScheduledSession } from '@mojo/scheduling/domain';
import type { Dispute } from '@mojo/trust-safety/domain';
import type { TutorProfile } from '@mojo/tutor-profile/domain';

export interface AdminUser {
  readonly id: string;
  readonly email: string;
  readonly role: 'admin';
}

/**
 * In-memory backing for the admin composition root (demo mode). Stashed on
 * `globalThis` so every Next.js route chunk shares one store (see the hub's
 * equivalent note) — otherwise queue-page renders would never see approvals
 * written by the review API route in standalone mode.
 */
export class AdminState {
  readonly users = new Map<string, AdminUser>();
  readonly profiles = new Map<string, TutorProfile>();
  readonly disputes = new Map<string, Dispute>();
  readonly featureFlags = new Map<string, FeatureFlag>();
  readonly auditLog: AuditLogEntry[] = [];
  readonly subjects: SubjectTaxonomyEntry[] = [];
  readonly reviews = new Map<string, Review>();
  readonly sessions = new Map<string, ScheduledSession>();
  walletCreditsMinor = 0;
  seeded = false;
}

const STATE_SYMBOL = Symbol.for('mojo.admin.demo.state');

/** Returns the process-wide admin demo store, creating it on first use. */
export function sharedAdminState(): AdminState {
  const globals = globalThis as Record<PropertyKey, unknown>;
  const existing = globals[STATE_SYMBOL] as AdminState | undefined;
  if (existing) return existing;
  const fresh = new AdminState();
  globals[STATE_SYMBOL] = fresh;
  return fresh;
}

/** Drops the shared store (test teardown only). */
export function clearSharedAdminState(): void {
  delete (globalThis as Record<PropertyKey, unknown>)[STATE_SYMBOL];
}

export function adminId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
