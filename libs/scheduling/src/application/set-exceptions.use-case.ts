import type { AvailabilityException } from '../domain/availability.types';
import type { AvailabilityRepository } from '../domain/scheduling.ports';

export interface SetExceptionInput {
  tutorId: string;
  date: string; // YYYY-MM-DD, in the tutor's timezone
  exceptions: Omit<AvailabilityException, 'tutorId' | 'date' | 'id'>[];
}

/**
 * Replaces the day's availability exceptions (blocked/extra windows). Ids are
 * minted here so the persisted set is stable across saves, and the full day's
 * list is returned so the UI can render exactly what was stored.
 */
export function makeSetExceptions(deps: { availability: AvailabilityRepository }) {
  return async function setExceptions(input: SetExceptionInput): Promise<void> {
    const withIds: AvailabilityException[] = input.exceptions.map((exception) => ({
      ...exception,
      id: `exception-${input.tutorId}-${input.date}-${exception.startMinute}-${exception.kind}`,
      tutorId: input.tutorId,
      date: input.date,
    }));
    await deps.availability.saveExceptions(input.tutorId, input.date, withIds);
  };
}
