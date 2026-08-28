import type { MojoEvent, MojoEventName } from './events.types';

type Handler<E extends MojoEvent> = (event: E) => void | Promise<void>;

/**
 * In-process pub/sub — the mechanism behind the event backbone in the
 * modular-monolith doc. Deliberately not a message queue: this is one
 * process, and the point is decoupled *code*, not decoupled *infrastructure*.
 * If a module ever needs to scale independently, this is the seam where a
 * real broker (SQS, Redis Streams, whatever) would slot in without touching
 * any subscriber's code.
 */
export class EventBus {
  private handlers = new Map<MojoEventName, Set<Handler<MojoEvent>>>();

  subscribe<E extends MojoEvent>(name: E['name'], handler: Handler<E>): () => void {
    const set = this.handlers.get(name) ?? new Set();
    set.add(handler as Handler<MojoEvent>);
    this.handlers.set(name, set);
    return () => set.delete(handler as Handler<MojoEvent>);
  }

  async publish<E extends MojoEvent>(event: E): Promise<void> {
    const set = this.handlers.get(event.name);
    if (!set) return;
    await Promise.all([...set].map((handler) => handler(event)));
  }
}

// One process-wide instance. Modules import this rather than constructing
// their own, so `booking` publishing and `pricing` subscribing actually
// talk to the same bus.
export const eventBus = new EventBus();
