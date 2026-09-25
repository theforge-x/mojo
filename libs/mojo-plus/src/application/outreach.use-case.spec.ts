import { describe, expect, it } from 'vitest';
import type { MojoPlusRepository, OutreachLeadRepository } from '../domain/mojo-plus.ports';
import type { MojoPlusSubscription, OutreachLead } from '../domain/mojo-plus.types';
import { makeListOutreachLeads } from './outreach.use-case';
import { MojoPlusRequiredError } from './subscribe-mojo-plus.use-case';

function fakeSubscriptions(store: MojoPlusSubscription | null = null): MojoPlusRepository {
  return {
    find: async (tutorId) => (store && store.tutorId === tutorId ? store : null),
    save: async () => {},
  };
}

function fakeLeads(rows: OutreachLead[] = []): OutreachLeadRepository {
  return {
    forTutor: async (tutorId) =>
      rows
        .filter((lead) => lead.tutorId === tutorId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

const ACTIVE: MojoPlusSubscription = {
  tutorId: 't_1',
  status: 'active',
  customSegmentRateMinor: null,
  subscribedAt: '2026-08-01T00:00:00.000Z',
  cancelledAt: null,
};

describe('listOutreachLeads', () => {
  it('returns leads for an active subscriber', async () => {
    const leads: OutreachLead[] = [
      { studentId: 'st_1', tutorId: 't_1', source: 'view', createdAt: '2026-09-01T10:00:00.000Z' },
      {
        studentId: 'st_2',
        tutorId: 't_1',
        source: 'search',
        createdAt: '2026-09-02T10:00:00.000Z',
      },
    ];
    const result = await makeListOutreachLeads({
      subscriptions: fakeSubscriptions(ACTIVE),
      leads: fakeLeads(leads),
    })('t_1');
    expect(result.map((lead) => lead.studentId)).toEqual(['st_2', 'st_1']);
  });

  it('rejects when there is no subscription', async () => {
    const list = makeListOutreachLeads({
      subscriptions: fakeSubscriptions(null),
      leads: fakeLeads(),
    });
    await expect(list('t_1')).rejects.toThrow(MojoPlusRequiredError);
  });

  it('rejects when the subscription was cancelled', async () => {
    const list = makeListOutreachLeads({
      subscriptions: fakeSubscriptions({ ...ACTIVE, status: 'cancelled' }),
      leads: fakeLeads(),
    });
    await expect(list('t_1')).rejects.toThrow(MojoPlusRequiredError);
  });
});
