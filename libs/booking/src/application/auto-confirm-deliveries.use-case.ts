import { AUTO_CONFIRM_WINDOW_HOURS } from '../domain/session-lifecycle.types';
import type { ConfirmDeliveryInput } from './confirm-delivery.use-case';

export interface AutoConfirmDeliveriesInput {
  nowIso: string;
  windowHours?: number;
}

export interface AutoConfirmDeliveriesResult {
  readonly confirmed: string[];
}

/**
 * Closes lessons neither side confirmed: anything still `confirmed` past the
 * auto-confirm window completes as `auto_window`, releasing the tutor's
 * take-home and generating the recap. The intake query excludes completed
 * sessions, and `confirmDelivery` refuses already-completed ones, so a run
 * can never double-pay — safe to re-run and to schedule blindly.
 */
export function makeAutoConfirmDeliveries(deps: {
  listAwaitingConfirmation: (endBeforeIso: string) => Promise<{ id: string }[]>;
  confirmDelivery: (input: ConfirmDeliveryInput) => Promise<void>;
  windowHours?: number;
}) {
  return async function autoConfirmDeliveries(
    input: AutoConfirmDeliveriesInput,
  ): Promise<AutoConfirmDeliveriesResult> {
    const windowHours = input.windowHours ?? deps.windowHours ?? AUTO_CONFIRM_WINDOW_HOURS;
    const cutoff = new Date(Date.parse(input.nowIso) - windowHours * 3600_000).toISOString();
    const awaiting = await deps.listAwaitingConfirmation(cutoff);
    const confirmed: string[] = [];
    for (const session of awaiting) {
      await deps.confirmDelivery({
        sessionId: session.id,
        confirmedBy: 'auto_window',
        nowIso: input.nowIso,
      });
      confirmed.push(session.id);
    }
    return { confirmed };
  };
}
