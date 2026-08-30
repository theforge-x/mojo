import type { AvailabilityRule } from '../domain/availability.types';
import type { AvailabilityRepository } from '../domain/scheduling.ports';

/**
 * Replaces a tutor's recurring weekly rules. Rule ids are minted here so the
 * persisted rules are stable across saves.
 */
export function makeSetAvailability(deps: { availability: AvailabilityRepository }) {
  return async function setAvailability(
    tutorId: string,
    rules: Omit<AvailabilityRule, 'tutorId'>[],
  ): Promise<void> {
    const withTutor = rules.map((rule) => ({
      ...rule,
      id: rule.id ?? `rule-${tutorId}-${rule.weekday}-${rule.startMinute}`,
      tutorId,
    }));
    await deps.availability.saveRules(withTutor);
  };
}

export interface UpdateSchedulingSettingsInput {
  tutorId: string;
  timezone: string;
  bufferMinutes?: number;
  minimumNoticeMinutes?: number;
  pausedForNewBookings?: boolean;
}

/**
 * Patches the tutor's scheduling settings (timezone, buffer, notice window).
 * Persisted by the same AvailabilityRepository that drives slot computation,
 * so the tutor's local wall-clock and the engine's timezone stay in sync.
 */
export function makeUpdateSchedulingSettings(deps: { availability: AvailabilityRepository }) {
  return async function updateSchedulingSettings(
    input: UpdateSchedulingSettingsInput,
  ): Promise<void> {
    const current = await deps.availability.getSettings(input.tutorId);
    await deps.availability.saveSettings({
      ...current,
      tutorId: input.tutorId,
      timezone: input.timezone,
      bufferMinutes: input.bufferMinutes ?? current.bufferMinutes ?? 15,
      minimumNoticeMinutes: input.minimumNoticeMinutes ?? current.minimumNoticeMinutes ?? 30,
      pausedForNewBookings: input.pausedForNewBookings ?? current.pausedForNewBookings ?? false,
    });
  };
}
