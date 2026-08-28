import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './event-bus';
import type { SessionCompleted } from './events.types';

describe('EventBus', () => {
  it('delivers a published event to a matching subscriber', async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe<SessionCompleted>('SessionCompleted', handler);

    const event: SessionCompleted = {
      name: 'SessionCompleted',
      occurredAt: new Date().toISOString(),
      payload: {
        sessionId: 's_1',
        tutorId: 't_1',
        studentId: 'st_1',
        segmentCount: 4,
        rate: { amountMinor: 600000, currency: 'NGN' },
      },
    };

    await bus.publish(event);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('does not call a subscriber registered for a different event name', async () => {
    const bus = new EventBus();
    const sessionHandler = vi.fn();
    bus.subscribe('SessionBooked', sessionHandler);

    await bus.publish({
      name: 'MojoPlusCancelled',
      occurredAt: new Date().toISOString(),
      payload: { tutorId: 't_1' },
    });

    expect(sessionHandler).not.toHaveBeenCalled();
  });

  it('unsubscribe stops further delivery to that handler', async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe('MojoPlusSubscribed', handler);
    unsubscribe();

    await bus.publish({
      name: 'MojoPlusSubscribed',
      occurredAt: new Date().toISOString(),
      payload: { tutorId: 't_1' },
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
