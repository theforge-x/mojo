import type { Money } from '@mojo/shared/domain';

/**
 * The event catalog from the modular-monolith doc, as actual types. Every
 * cross-module reaction in the system is one of these — if a module needs to
 * react to something that isn't here yet, the event belongs here before the
 * subscriber gets written, not the other way round.
 */

export interface DomainEvent<Name extends string, Payload> {
  readonly name: Name;
  readonly occurredAt: string; // ISO UTC
  readonly payload: Payload;
}

export type SessionBooked = DomainEvent<
  'SessionBooked',
  { sessionId: string; tutorId: string; studentId: string; isTrial: boolean }
>;

export type SessionCancelled = DomainEvent<
  'SessionCancelled',
  { sessionId: string; cancelledBy: 'student' | 'tutor' | 'admin'; withinNoticeWindow: boolean }
>;

export type SessionCompleted = DomainEvent<
  'SessionCompleted',
  { sessionId: string; tutorId: string; studentId: string; segmentCount: number; rate: Money }
>;

export type SessionNoShow = DomainEvent<
  'SessionNoShow',
  { sessionId: string; noShowBy: 'student' | 'tutor' }
>;

export type SessionRescheduled = DomainEvent<
  'SessionRescheduled',
  {
    sessionId: string;
    tutorId: string;
    studentId: string;
    oldStartIso: string;
    oldEndIso: string;
    newStartIso: string;
    newEndIso: string;
  }
>;

export type SessionDeliveryConfirmed = DomainEvent<
  'SessionDeliveryConfirmed',
  { sessionId: string; confirmedBy: 'student' | 'auto_window' }
>;

export type TutorLevelChanged = DomainEvent<
  'TutorLevelChanged',
  { tutorId: string; fromLevel: string; toLevel: string }
>;

export type MojoPlusSubscribed = DomainEvent<'MojoPlusSubscribed', { tutorId: string }>;
export type MojoPlusCancelled = DomainEvent<'MojoPlusCancelled', { tutorId: string }>;

export type PayoutRequested = DomainEvent<'PayoutRequested', { tutorId: string; amount: Money }>;
export type PayoutCompleted = DomainEvent<
  'PayoutCompleted',
  { tutorId: string; amount: Money; rail: string }
>;

export type TutorApplicationSubmitted = DomainEvent<
  'TutorApplicationSubmitted',
  { applicationId: string; tutorId: string }
>;

export type ReviewSubmitted = DomainEvent<
  'ReviewSubmitted',
  { sessionId: string; tutorId: string; rating: number }
>;

export type ReferralConverted = DomainEvent<
  'ReferralConverted',
  { code: string; newUserId: string }
>;

export type DisputeFiled = DomainEvent<
  'DisputeFiled',
  { sessionId: string; filedBy: string; reason: string }
>;
export type DisputeResolved = DomainEvent<
  'DisputeResolved',
  { disputeId: string; outcome: 'upheld' | 'dismissed' }
>;

export type MojoEvent =
  | SessionBooked
  | SessionCancelled
  | SessionCompleted
  | SessionNoShow
  | SessionRescheduled
  | SessionDeliveryConfirmed
  | TutorLevelChanged
  | MojoPlusSubscribed
  | MojoPlusCancelled
  | PayoutRequested
  | PayoutCompleted
  | TutorApplicationSubmitted
  | ReviewSubmitted
  | ReferralConverted
  | DisputeFiled
  | DisputeResolved;

export type MojoEventName = MojoEvent['name'];
