import type { MojoPlusSubscription } from './mojo-plus.types';

/**
 * Port — what the application layer needs from the outside world, defined
 * here so `infrastructure` implements it and `domain` never knows Prisma.
 */
export interface MojoPlusRepository {
  find(tutorId: string): Promise<MojoPlusSubscription | null>;
  save(subscription: MojoPlusSubscription): Promise<void>;
}
