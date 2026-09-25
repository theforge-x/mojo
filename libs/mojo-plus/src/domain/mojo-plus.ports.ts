import type { MojoPlusSubscription, OutreachLead } from './mojo-plus.types';

/**
 * Port — what the application layer needs from the outside world, defined
 * here so `infrastructure` implements it and `domain` never knows Prisma.
 */
export interface MojoPlusRepository {
  find(tutorId: string): Promise<MojoPlusSubscription | null>;
  save(subscription: MojoPlusSubscription): Promise<void>;
}

/**
 * Read-side port for tutor-outreach leads. The messaging module owns the
 * data; the app's composition root adapts its `InterestRepository` to this
 * shape (same method, structurally identical rows).
 */
export interface OutreachLeadRepository {
  forTutor(tutorId: string): Promise<OutreachLead[]>;
}
