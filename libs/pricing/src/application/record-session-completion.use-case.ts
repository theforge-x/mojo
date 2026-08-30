import { money } from '@mojo/shared/domain';
import type { SessionCompleted } from '@mojo/shared/events';
import {
  calculateLessonCharge,
  calculateTrialLessonCharge,
  effectiveTakeHomePercent,
} from '../domain/calculate-lesson-charge';
import type { TutorLevelReader } from '../domain/pricing.ports';
import type { CommissionSplit } from '../domain/pricing.types';
import { BASE_TAKE_HOME_PERCENT, DEFAULT_SEGMENT_RATE_NGN } from '../domain/pricing.types';

/**
 * Subscribes (conceptually — wiring to eventBus.subscribe happens at the
 * app composition root) to SessionCompleted and turns it into a commission
 * split. Depends only on the TutorLevelReader port, not Prisma directly.
 */
export function makeRecordSessionCompletion(levels: TutorLevelReader) {
  return async function recordSessionCompletion(event: SessionCompleted): Promise<CommissionSplit> {
    const { tutorId, segmentCount } = event.payload;
    const [level, hasMojoPlus, customRateMinor] = await Promise.all([
      levels.getLevel(tutorId),
      levels.hasMojoPlus(tutorId),
      levels.getCustomRateMinor(tutorId),
    ]);

    const perSegment = money(customRateMinor ?? DEFAULT_SEGMENT_RATE_NGN[level], 'NGN');
    const rate = { level, perSegment, isCustom: customRateMinor !== null };

    if (event.payload.rate.amountMinor === 0) {
      // A zero-rate event is how the trial lesson signals itself upstream —
      // see the `booking` module's SessionCompleted publisher.
      return calculateTrialLessonCharge(segmentCount, rate);
    }

    const takeHome = effectiveTakeHomePercent(BASE_TAKE_HOME_PERCENT[level], hasMojoPlus);
    return calculateLessonCharge(segmentCount, rate, takeHome);
  };
}
