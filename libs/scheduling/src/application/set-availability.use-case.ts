import type { AvailabilityRule } from '../domain/availability.types';

/**
 * Placeholder persistence signature — the real implementation would go
 * through an AvailabilityRepository write method not yet defined on the
 * read-oriented port above. Included to keep the tutor-facing "set weekly
 * availability" feature represented at the application layer, matching the
 * roles/permissions doc's `availability.edit` action.
 */
export function makeSetAvailability(deps: { save: (rules: AvailabilityRule[]) => Promise<void> }) {
  return async function setAvailability(tutorId: string, rules: Omit<AvailabilityRule, 'tutorId'>[]): Promise<void> {
    const withTutor = rules.map((rule) => ({ ...rule, tutorId }));
    await deps.save(withTutor);
  };
}
