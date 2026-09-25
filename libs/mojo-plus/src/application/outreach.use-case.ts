import type { MojoPlusRepository, OutreachLeadRepository } from '../domain/mojo-plus.ports';
import { isMojoPlusActive } from '../domain/mojo-plus.types';
import { MojoPlusRequiredError } from './subscribe-mojo-plus.use-case';

export interface OutreachDeps {
  readonly subscriptions: MojoPlusRepository;
  readonly leads: OutreachLeadRepository;
}

/**
 * Tutor outreach is a Mojo+ benefit: only active subscribers may list the
 * students who searched for or viewed their profile. Interest is still
 * *recorded* for every tutor (messaging module) so leads accumulate while
 * unsubscribed and unlock on activation — the repository is the same store.
 */
export function makeListOutreachLeads({ subscriptions, leads }: OutreachDeps) {
  return async function listOutreachLeads(tutorId: string) {
    const subscription = await subscriptions.find(tutorId);
    if (!isMojoPlusActive(subscription)) throw new MojoPlusRequiredError('Tutor outreach');
    return leads.forTutor(tutorId);
  };
}
