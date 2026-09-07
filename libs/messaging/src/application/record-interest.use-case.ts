import type { InterestRepository } from '../domain/messaging.ports';
import type { InterestSource, TutorInterest } from '../domain/messaging.types';

export interface RecordInterestInput {
  readonly studentId: string;
  readonly tutorId: string;
  readonly source: InterestSource;
  readonly nowIso?: string;
}

export interface InterestDeps {
  readonly interests: InterestRepository;
}

export function makeRecordInterest({ interests }: InterestDeps) {
  return async function recordInterest(input: RecordInterestInput): Promise<void> {
    const existing = await interests.find(input.studentId, input.tutorId);
    const interest: TutorInterest = {
      id: existing?.id ?? `${input.studentId}:${input.tutorId}`,
      studentId: input.studentId,
      tutorId: input.tutorId,
      source: input.source,
      createdAt: input.nowIso ?? new Date().toISOString(),
    };
    await interests.record(interest);
  };
}

export function makeListTutorInterests({ interests }: InterestDeps) {
  return function listTutorInterests(tutorId: string) {
    return interests.forTutor(tutorId);
  };
}
