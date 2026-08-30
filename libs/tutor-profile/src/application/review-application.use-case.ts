import type { ApplicationRepository, TutorProfileRepository } from '../domain/tutor-profile.ports';
import type { TutorApplication, TutorProfile } from '../domain/tutor-profile.types';

export interface ReviewApplicationInput {
  applicationId: string;
  decision: 'approved' | 'rejected';
  nowIso: string;
}

export class ApplicationNotFoundError extends Error {
  constructor(id: string) {
    super(`No application found for id ${id}.`);
  }
}

export class ApplicationAlreadyReviewedError extends Error {
  constructor(id: string) {
    super(`Application ${id} has already been reviewed.`);
  }
}

/**
 * The admin-side decision on a tutor application. Approving also publishes
 * the applicant as a searchable tutor by upserting their TutorProfile —
 * rejecting only advances the application state.
 */
export function makeReviewApplication(deps: {
  applications: ApplicationRepository;
  profiles: TutorProfileRepository;
}) {
  return async function reviewApplication(
    input: ReviewApplicationInput,
  ): Promise<TutorApplication> {
    const existing = await deps.applications.findById(input.applicationId);
    if (!existing) throw new ApplicationNotFoundError(input.applicationId);
    if (existing.status !== 'pending')
      throw new ApplicationAlreadyReviewedError(input.applicationId);

    const updated: TutorApplication = {
      ...existing,
      status: input.decision === 'approved' ? 'approved' : 'rejected',
    };

    if (input.decision === 'approved') {
      await deps.profiles.save(profileFromApplication(existing));
    }

    await deps.applications.save(updated);
    return updated;
  };
}

function profileFromApplication(app: TutorApplication): TutorProfile {
  return {
    tutorId: app.tutorId,
    displayName:
      app.displayName || (app.subjects[0] ? `Tutor — ${app.subjects.join(', ')}` : 'New tutor'),
    photoUrl: app.photoUrl,
    education: app.education,
    subjects: app.subjects,
    bio: app.bio,
    timezone: app.timezone,
    moderationFlagged: false,
  };
}
