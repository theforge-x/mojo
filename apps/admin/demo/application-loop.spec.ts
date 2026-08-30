import { clearSharedDemoState, sharedDemoState } from '@mojo/demo-state';
import type { TutorApplication } from '@mojo/tutor-profile/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import { getAdmin, resetAdminForTests } from './composition-root';

function pendingApplication(prefix: string): TutorApplication {
  return {
    id: `${prefix}_app`,
    tutorId: `${prefix}_tutor`,
    displayName: 'Demo Applicant',
    photoUrl: '',
    education: 'M.Sc. — Test University',
    subjects: ['Maths'],
    bio: 'A short but genuinely useful intro that clears the character bar.',
    introVideoUrl: '',
    certifications: [],
    timezone: 'Africa/Lagos',
    availability: [{ id: `${prefix}_w`, weekday: 2, startMinute: 540, endMinute: 720 }],
    status: 'pending',
    submittedAt: '2026-08-30T09:00:00.000Z',
  };
}

describe('hub-backed application review', () => {
  beforeEach(() => {
    // Force the in-memory demo path and the shared `DemoState` (no HUB_URL
    // bridge, no database). The shared store is the object the hub facade
    // reads and writes, so asserting on it here exercises the real loop.
    process.env.USE_PRISMA = 'false';
    process.env.HUB_URL = '';
    resetAdminForTests();
    clearSharedDemoState();
  });

  it('approves the exact application the hub holds and publishes its profile', async () => {
    const shared = sharedDemoState();
    const app = pendingApplication('approve');
    // `hub.profile.submitApplication` writes into this same shared store.
    shared.applications.set(app.id, app);

    const queue = await getAdmin().applications.list();
    expect(queue.map((a) => a.id)).toContain(app.id);

    const reviewed = await getAdmin().applications.review({
      applicationId: app.id,
      decision: 'approved',
    });
    expect(reviewed.status).toBe('approved');

    expect(shared.applications.get(app.id)?.status).toBe('approved');
    expect(shared.profiles.get(app.tutorId)?.displayName).toBe(app.displayName);

    const adminProfile = await getAdmin().profiles.byTutor(app.tutorId);
    expect(adminProfile?.displayName).toBe(app.displayName);
  });

  it('rejects the exact application the hub holds without publishing a profile', async () => {
    const shared = sharedDemoState();
    const app = pendingApplication('reject');
    shared.applications.set(app.id, app);

    const reviewed = await getAdmin().applications.review({
      applicationId: app.id,
      decision: 'rejected',
    });
    expect(reviewed.status).toBe('rejected');

    expect(shared.applications.get(app.id)?.status).toBe('rejected');
    expect(shared.profiles.get(app.tutorId)).toBeUndefined();
    expect(await getAdmin().profiles.byTutor(app.tutorId)).toBeNull();
  });

  it('refuses to review an application that never reached the hub', async () => {
    const ghost = pendingApplication('ghost');

    await expect(
      getAdmin().applications.review({ applicationId: ghost.id, decision: 'approved' }),
    ).rejects.toThrow(`No application found for id ${ghost.id}.`);
  });
});
