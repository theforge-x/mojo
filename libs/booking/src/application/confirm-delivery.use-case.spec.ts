import { eventBus } from '@mojo/shared/events';
import { describe, expect, it } from 'vitest';
import type { BookingRepository, SegmentRateReader } from '../domain/booking.ports';
import type { BookingSession } from '../domain/booking-session.types';
import {
  makeConfirmDelivery,
  SessionAlreadyCompletedError,
  SessionNotBookedError,
} from './confirm-delivery.use-case';

function fakeSession(overrides: Partial<BookingSession> = {}): BookingSession {
  return {
    id: 's_1',
    tutorId: 't_1',
    studentId: 'st_1',
    startIso: '2026-09-01T10:00:00.000Z',
    endIso: '2026-09-01T11:00:00.000Z',
    isTrial: false,
    status: 'confirmed',
    groupSize: null,
    ...overrides,
  };
}

function fakeBookings(session: BookingSession | null): BookingRepository {
  return {
    findById: async () => session,
    listAwaitingConfirmation: async () => [],
    markCompleted: async () => {},
    markNoShow: async () => {},
    saveConfirmation: async () => {},
  };
}

describe('confirmDelivery', () => {
  const rates: SegmentRateReader = { perSegmentMinor: async () => 800_000 };

  it('publishes SessionCompleted with a segment count derived from duration', async () => {
    const session = fakeSession();
    const bookings = fakeBookings(session);
    let completed: unknown = null;
    eventBus.subscribe('SessionCompleted', (e) => {
      completed = e;
    });

    const confirmDelivery = makeConfirmDelivery({ bookings, rates });
    await confirmDelivery({
      sessionId: 's_1',
      confirmedBy: 'student',
      nowIso: '2026-09-01T11:05:00.000Z',
    });

    expect(completed).toMatchObject({
      payload: { segmentCount: 4, tutorId: 't_1', rate: { amountMinor: 800_000 } },
    });
  });

  it('publishes a zero rate for trial sessions', async () => {
    const session = fakeSession({ isTrial: true });
    const bookings = fakeBookings(session);
    let completed: unknown = null;
    eventBus.subscribe('SessionCompleted', (e) => {
      completed = e;
    });

    const confirmDelivery = makeConfirmDelivery({ bookings, rates });
    await confirmDelivery({
      sessionId: 's_1',
      confirmedBy: 'student',
      nowIso: '2026-09-01T11:05:00.000Z',
    });

    expect(completed).toMatchObject({ payload: { rate: { amountMinor: 0 } } });
  });

  it('refuses to complete an already-completed session twice', async () => {
    const bookings = fakeBookings(fakeSession({ status: 'completed' }));
    const confirmDelivery = makeConfirmDelivery({ bookings, rates });

    await expect(
      confirmDelivery({
        sessionId: 's_1',
        confirmedBy: 'student',
        nowIso: '2026-09-01T11:05:00.000Z',
      }),
    ).rejects.toThrow(SessionAlreadyCompletedError);
  });

  it('throws if the session does not exist', async () => {
    const bookings = fakeBookings(null);
    const confirmDelivery = makeConfirmDelivery({ bookings, rates });

    await expect(
      confirmDelivery({
        sessionId: 'missing',
        confirmedBy: 'student',
        nowIso: '2026-09-01T11:05:00.000Z',
      }),
    ).rejects.toThrow(SessionNotBookedError);
  });
});
