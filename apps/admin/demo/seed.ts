import type { ScheduledSession } from '@mojo/scheduling/domain';
import { AdminState } from './state';

export function seedAdmin(state: AdminState): void {
  state.users.set('u_admin', { id: 'u_admin', email: 'admin@mojo.dev', role: 'admin' });

  for (const tutorId of ['t_1', 't_2', 't_3']) {
    state.profiles.set(tutorId, {
      tutorId,
      displayName: tutorId === 't_1' ? 'Kelechi O.' : tutorId === 't_2' ? 'Ifeoma A.' : 'Tunde M.',
      photoUrl: '',
      subjects: tutorId === 't_2' ? ['French', 'English'] : ['Spanish', 'Maths'].slice(tutorId === 't_3' ? 1 : 0, 1),
      bio: '',
      moderationFlagged: false,
    });
  }

  const now = Date.now();
  [hour(now, 2), hour(now, 5), hour(now, 9)].forEach((iso, index) => {
    state.applications.set(`app_${index + 1}`, {
      id: `app_${index + 1}`,
      tutorId: `t_new_${index + 1}`,
      subjects: index === 0 ? ['Spanish'] : index === 1 ? ['Guitar'] : ['Maths'],
      bio: index === 0 ? 'Native speaker with 6 years of online teaching.' : 'Patient classroom teacher making the jump to live tutoring.',
      introVideoUrl: '',
      certifications: [],
      status: 'pending',
      submittedAt: iso,
    });
  });

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

  state.featureFlags.set('trial_pricing', { key: 'trial_pricing', enabled: true, rolloutPercent: 100 });
  state.featureFlags.set('surge_pricing', { key: 'surge_pricing', enabled: false, rolloutPercent: 25 });
  state.featureFlags.set('referral_rewards', { key: 'referral_rewards', enabled: true, rolloutPercent: 100 });

  state.subjects.push(
    { id: 'sub_1', name: 'Languages', parentId: null },
    { id: 'sub_2', name: 'Spanish', parentId: 'sub_1' },
    { id: 'sub_3', name: 'French', parentId: 'sub_1' },
    { id: 'sub_4', name: 'Maths', parentId: null },
    { id: 'sub_5', name: 'Music', parentId: null },
    { id: 'sub_6', name: 'Guitar', parentId: 'sub_5' },
  );

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