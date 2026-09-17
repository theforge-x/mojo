import { describe, expect, it, vi } from 'vitest';
import { AUTO_CONFIRM_WINDOW_HOURS } from '../domain/session-lifecycle.types';
import { makeAutoConfirmDeliveries } from './auto-confirm-deliveries.use-case';
import type { ConfirmDeliveryInput } from './confirm-delivery.use-case';

describe('autoConfirmDeliveries', () => {
  it('confirms sessions past the window as auto_window', async () => {
    const seenCutoff: string[] = [];
    const confirmed: ConfirmDeliveryInput[] = [];
    const autoConfirm = makeAutoConfirmDeliveries({
      listAwaitingConfirmation: async (endBeforeIso) => {
        seenCutoff.push(endBeforeIso);
        return [{ id: 's_old' }, { id: 's_older' }];
      },
      confirmDelivery: async (input) => {
        confirmed.push(input);
      },
    });

    const result = await autoConfirm({ nowIso: '2026-09-20T12:00:00.000Z' });

    expect(result).toEqual({ confirmed: ['s_old', 's_older'] });
    expect(seenCutoff).toHaveLength(1);
    const expectedCutoff = new Date(
      Date.parse('2026-09-20T12:00:00.000Z') - AUTO_CONFIRM_WINDOW_HOURS * 3600_000,
    ).toISOString();
    expect(seenCutoff[0]).toBe(expectedCutoff);
    expect(confirmed.every((c) => c.confirmedBy === 'auto_window')).toBe(true);
  });

  it('does nothing when nothing is overdue', async () => {
    const confirmDelivery = vi.fn(async (_input: ConfirmDeliveryInput) => {});
    const autoConfirm = makeAutoConfirmDeliveries({
      listAwaitingConfirmation: async () => [],
      confirmDelivery,
    });

    const result = await autoConfirm({ nowIso: '2026-09-20T12:00:00.000Z' });

    expect(result).toEqual({ confirmed: [] });
    expect(confirmDelivery).not.toHaveBeenCalled();
  });
});
