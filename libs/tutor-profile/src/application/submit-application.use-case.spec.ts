import { eventBus } from '@mojo/shared/events';
import { describe, expect, it } from 'vitest';
import type { ApplicationRepository } from '../domain/tutor-profile.ports';
import type { TutorApplication } from '../domain/tutor-profile.types';
import { ApplicationSubmittedError, makeSubmitApplication } from './submit-application.use-case';

function fakeApplications(initial: TutorApplication | null = null) {
  let store = initial;
  const repo: ApplicationRepository = {
    findById: async (id) => (store && store.id === id ? store : null),
    list: async () => (store ? [store] : []),
    save: async (app) => {
      store = app;
    },
  };
  return { repo, get: () => store };
}

function sampleApplication(overrides: Partial<TutorApplication> = {}): TutorApplication {
  return {
    id: 'app_1',
    tutorId: 't_1',
    displayName: 'Ada Yusuf',
    photoUrl: '',
    education: 'B.Sc. Mathematics — ABU Zaria',
    subjects: ['maths'],
    bio: 'I love teaching',
    introVideoUrl: 'https://ex.com/v',
    certifications: ['NCE'],
    timezone: 'Africa/Lagos',
    availability: [{ id: 'a1', weekday: 1, startMinute: 480, endMinute: 720 }],
    status: 'pending',
    submittedAt: '2026-09-01T09:00:00.000Z',
    ...overrides,
  };
}

describe('submitApplication', () => {
  it('saves the application', async () => {
    const { repo, get } = fakeApplications();
    const app = sampleApplication();
    await makeSubmitApplication({ applications: repo })(app, '2026-09-01T10:00:00.000Z');
    expect(get()?.id).toBe('app_1');
  });

  it('publishes TutorApplicationSubmitted', async () => {
    const { repo } = fakeApplications();
    let captured: unknown = null;
    const unsubscribe = eventBus.subscribe('TutorApplicationSubmitted', (e) => {
      captured = e;
    });
    try {
      await makeSubmitApplication({ applications: repo })(
        sampleApplication(),
        '2026-09-01T10:00:00.000Z',
      );
      expect(captured).toMatchObject({
        name: 'TutorApplicationSubmitted',
        payload: { applicationId: 'app_1', tutorId: 't_1' },
      });
    } finally {
      unsubscribe();
    }
  });

  it('rejects a duplicate submission', async () => {
    const existing = sampleApplication();
    const { repo } = fakeApplications(existing);
    await expect(
      makeSubmitApplication({ applications: repo })(existing, '2026-09-01T10:00:00.000Z'),
    ).rejects.toThrow(ApplicationSubmittedError);
  });
});
