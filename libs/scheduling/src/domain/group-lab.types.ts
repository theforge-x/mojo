export type GroupLabStatus = 'open' | 'locked' | 'cancelled';

export interface GroupLab {
  readonly id: string;
  readonly tutorId: string;
  readonly title: string;
  readonly startIso: string; // UTC
  readonly endIso: string; // UTC
  readonly maxSeats: number;
  readonly status: GroupLabStatus;
  /** Frozen member count at lock time — the ladder size everyone settles at. */
  readonly lockedSize: number | null;
  readonly createdAt: string;
}

/** Seats currently taken — members whose sessions aren't cancelled or no-show. */
export function activeMemberCount(members: readonly { status: string }[]): number {
  return members.filter((m) => m.status !== 'cancelled' && m.status !== 'no_show').length;
}
