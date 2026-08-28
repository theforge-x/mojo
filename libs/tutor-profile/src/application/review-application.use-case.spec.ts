import { describe, expect, it } from 'vitest';
import type { ApplicationRepository, TutorProfileRepository } from '../domain/tutor-profile.ports';
import type { TutorApplication } from '../domain/tutor-profile.types';
import {
  ApplicationAlreadyReviewedError,
  ApplicationNotFoundError,
  makeReviewApplication,
} from './review-application.use-case';

function fakeRepos(initial: TutorApplication | null = null) {
  let store = initial;
  let profileSaved: unknown = null;
  const applications: ApplicationRepository = {
    findById: async (id) => (store && store.id === id ? store : null),
    save: async (app) => {
      store = app;
    },
  };
  const profiles: TutorProfileRepository = {
    findByTutorId: async () => null,
    save: async (profile) => {
      profileSaved = profile;
    },
  };
  return { applications, profiles, get: () => store, getProfile: () => profileSaved };
}

function sampleApplication(overrides: Partial<TutorApplication> = {}): TutorApplication {
  return {
    id: 'app_1',
    tutorId: 't_1',
    subjects: ['Spanish'],
    bio: 'Native speaker',
    introVideoUrl: 'https://ex.com/v',
    certifications: ['DELE'],
    status: 'pending',
    submittedAt: '2026-09-01T09:00:00.000Z',
    ...overrides,
  };
}

describe('reviewApplication', () => {
  it('approves a pending application and publishes a tutor profile', async () => {
    const { applications, profiles, get, getProfile } = fakeRepos(sampleApplication());
    await makeReviewApplication({ applications, profiles })({
      applicationId: 'app_1',
      decision: 'approved',
      nowIso: '2026-09-02T10:00:00.000Z',
    });

    expect(get()?.status).toBe('approved');
    expect(getProfile()).toMatchObject({ tutorId: 't_1', subjects: ['Spanish'] });
  });

  it('rejects a pending application without creating a profile', async () => {
    const { applications, profiles, get, getProfile } = fakeRepos(sampleApplication());
    await makeReviewApplication({ applications, profiles })({
      applicationId: 'app_1',
      decision: 'rejected',
      nowIso: '2026-09-02T10:00:00.000Z',
    });

    expect(get()?.status).toBe('rejected');
    expect(getProfile()).toBeNull();
  });

  it('throws when the application does not exist', async () => {
    const { applications, profiles } = fakeRepos();
    await expect(
      makeReviewApplication({ applications, profiles })({
        applicationId: 'missing',
        decision: 'approved',
        nowIso: '2026-09-02T10:00:00.000Z',
      }),
    ).rejects.toThrow(ApplicationNotFoundError);
  });

  it('throws when the application was already reviewed', async () => {
    const { applications, profiles } = fakeRepos(sampleApplication({ status: 'approved' }));
    await expect(
      makeReviewApplication({ applications, profiles })({
        applicationId: 'app_1',
        decision: 'approved',
        nowIso: '2026-09-02T10:00:00.000Z',
      }),
    ).rejects.toThrow(ApplicationAlreadyReviewedError);
  });
});