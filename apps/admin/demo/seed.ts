import { DEFAULT_TAXONOMY_SEED } from '@mojo/admin-config/domain';
import { seedDemoApplications } from '@mojo/demo-state';
import type { ScheduledSession } from '@mojo/scheduling/domain';
import type { ApplicationProfileStore } from './repos';
import type { AdminState } from './state';

export function seedAdmin(state: AdminState, shared: ApplicationProfileStore): void {
  state.users.set('u_admin', { id: 'u_admin', email: 'admin@mojo.dev', role: 'admin' });

  for (const tutorId of ['t_1', 't_2', 't_3']) {
    const profile = {
      tutorId,
      displayName: tutorId === 't_1' ? 'Kelechi O.' : tutorId === 't_2' ? 'Ifeoma A.' : 'Tunde M.',
      photoUrl: '',
      education:
        tutorId === 't_1'
          ? 'B.A. Modern Languages'
          : tutorId === 't_2'
            ? 'M.A. French Linguistics'
            : 'B.Sc. Mathematics',
      subjects:
        tutorId === 't_2'
          ? ['French', 'English']
          : ['Spanish', 'Maths'].slice(tutorId === 't_3' ? 1 : 0, 1),
      languages:
        tutorId === 't_2'
          ? ['English', 'French']
          : tutorId === 't_3'
            ? ['English']
            : ['English', 'Spanish'],
      bio: '',
      introVideoUrl: '',
      timezone: 'Africa/Lagos',
      moderationFlagged: false,
    };
    // The admin analytics dashboard reads its own store...
    state.profiles.set(tutorId, profile);
    // ...while the review surfaces read the hub's shared store. Add-if-absent
    // so the hub's richer seed (populated by `seedDemo`) is never clobbered.
    if (!shared.profiles.has(tutorId)) shared.profiles.set(tutorId, profile);
  }

  // The review queue lives on the hub's shared `DemoState` — the demo's single
  // system of record — so an approve/reject decision lands on the same
  // application the hub holds. Add-if-absent keeps this idempotent.
  seedDemoApplications(shared);

  const now = Date.now();

  state.disputes.set('d_1', {
    id: 'd_1',
    sessionId: 's_5',
    filedBy: 'student',
    reason: 'Tutor joined 20 minutes late and the lesson felt rushed.',
    status: 'open',
    filedAt: hour(now, 1),
    resolvedAt: null,
  });
  state.disputes.set('d_2', {
    id: 'd_2',
    sessionId: 's_6',
    filedBy: 'tutor',
    reason: 'Student did not show up for the confirmed session.',
    status: 'open',
    filedAt: hour(now, 3),
    resolvedAt: null,
  });
  state.disputes.set('d_3', {
    id: 'd_3',
    sessionId: 's_7',
    filedBy: 'student',
    reason: 'Charge on a cancelled session.',
    status: 'dismissed',
    filedAt: hour(now, 40),
    resolvedAt: hour(now, 30),
  });

  state.featureFlags.set('trial_pricing', {
    key: 'trial_pricing',
    enabled: true,
    rolloutPercent: 100,
  });
  state.featureFlags.set('surge_pricing', {
    key: 'surge_pricing',
    enabled: false,
    rolloutPercent: 25,
  });
  state.featureFlags.set('referral_rewards', {
    key: 'referral_rewards',
    enabled: true,
    rolloutPercent: 100,
  });

  if (state.subjects.length === 0) {
    for (const entry of DEFAULT_TAXONOMY_SEED) state.subjects.push({ ...entry });
  }

  state.reviews.set('r_1', {
    id: 'r_1',
    sessionId: 's_2',
    tutorId: 't_1',
    studentId: 'st_1',
    rating: 5,
    body: 'Incredible energy, the market-scenario roleplay was so useful.',
    flagged: false,
    createdAt: hour(now, 2),
  });
  state.reviews.set('r_2', {
    id: 'r_2',
    sessionId: 's_8',
    tutorId: 't_2',
    studentId: 'st_2',
    rating: 2,
    body: 'Sound kept cutting out and we lost the last fifteen minutes.',
    flagged: true,
    createdAt: hour(now, 8),
  });

  const session = (id: string, tutorId: string, status: ScheduledSession['status']): void => {
    state.sessions.set(id, {
      id,
      tutorId,
      studentId: 'st_1',
      startIso: hour(now, 6),
      endIso: hour(now, 7),
      status,
      isTrial: false,
      statusHistory: [],
    });
  };
  session('s_1', 't_1', 'completed');
  session('s_2', 't_1', 'completed');
  session('s_3', 't_2', 'booked');
  session('s_4', 't_3', 'cancelled');
  session('s_5', 't_2', 'completed');
  session('s_6', 't_1', 'confirmed');
  session('s_7', 't_3', 'completed');
  session('s_8', 't_2', 'completed');

  state.walletCreditsMinor = 42_600_000;
}

function hour(now: number, deltaHours: number): string {
  return new Date(now - deltaHours * 3600_000).toISOString();
}
