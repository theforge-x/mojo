import type { SessionCompleted } from '@mojo/shared/events';
import { describe, expect, it } from 'vitest';
import type { TutorLevelReader } from '../domain/pricing.ports';
import { makeRecordSessionCompletion } from './record-session-completion.use-case';

function fakeLevels(overrides: Partial<TutorLevelReader> = {}): TutorLevelReader {
  return {
    getLevel: async () => 'established',
    hasMojoPlus: async () => false,
    getCustomRateMinor: async () => null,
    ...overrides,
  };
}

function completedEvent(segmentCount: number, rateMinor = 600_000): SessionCompleted {
  return {
    name: 'SessionCompleted',
    occurredAt: '2026-09-01T12:00:00.000Z',
    payload: {
      sessionId: 's_1',
      tutorId: 't_1',
      studentId: 'st_1',
      segmentCount,
      rate: { amountMinor: rateMinor, currency: 'NGN' },
    },
  };
}

describe('recordSessionCompletion', () => {
  it('computes the standard split for a non-trial Established lesson', async () => {
    const recordSessionCompletion = makeRecordSessionCompletion(fakeLevels());
    const result = await recordSessionCompletion(completedEvent(4));

    expect(result.total.amountMinor).toBe(2_400_000);
    expect(result.tutorTakeHome.amountMinor).toBe(1_440_000);
  });

  it('applies the Mojo+ bonus when the tutor is subscribed', async () => {
    const recordSessionCompletion = makeRecordSessionCompletion(
      fakeLevels({ hasMojoPlus: async () => true }),
    );
    const result = await recordSessionCompletion(completedEvent(4));

    expect(result.tutorTakeHome.amountMinor).toBe(1_680_000);
  });

  it('uses the custom rate instead of the level default when one is set', async () => {
    const recordSessionCompletion = makeRecordSessionCompletion(
      fakeLevels({ getCustomRateMinor: async () => 750_000 }),
    );
    const result = await recordSessionCompletion(completedEvent(2));

    expect(result.total.amountMinor).toBe(1_500_000);
  });

  it('pays the tutor ₦0 for a trial lesson regardless of level or Mojo+', async () => {
    const recordSessionCompletion = makeRecordSessionCompletion(
      fakeLevels({ hasMojoPlus: async () => true }),
    );
    const result = await recordSessionCompletion(completedEvent(4, 0));

    expect(result.tutorTakeHome.amountMinor).toBe(0);
  });
});
