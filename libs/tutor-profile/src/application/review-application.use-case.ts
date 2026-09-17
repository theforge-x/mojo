import type { ApplicationRepository, TutorProfileRepository } from '../domain/tutor-profile.ports';
import type { TutorApplication, TutorProfile } from '../domain/tutor-profile.types';

export type ReviewDecision = 'approved' | 'rejected' | 'in_review';

export interface ReviewApplicationInput {
  applicationId: string;
  decision: ReviewDecision;
  /** Rejection reason — required when rejecting so the applicant can fix and resubmit. */
  note?: string;
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

export class MissingReviewNoteError extends Error {
  constructor() {
    super('A rejection needs a short reason so the applicant knows what to fix.');
  }
}

/**
 * The admin-side decision on a tutor application. `pending` moves to
 * `in_review` (a reviewer picked it up) or straight to a final decision;
 * `in_review` moves to a final decision. Approving publishes the applicant
 * as a searchable tutor by upserting their TutorProfile (carrying the intro
 * video); rejecting records the reason for the resubmit form.
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

    if (existing.status !== 'pending' && existing.status !== 'in_review') {
      throw new ApplicationAlreadyReviewedError(input.applicationId);
    }
    if (input.decision === 'in_review' && existing.status !== 'pending') {
      throw new ApplicationAlreadyReviewedError(input.applicationId);
    }
    if (input.decision === 'rejected' && !input.note?.trim()) {
      throw new MissingReviewNoteError();
    }

    const updated: TutorApplication = {
      ...existing,
      status: input.decision,
      reviewNote: input.decision === 'rejected' ? (input.note?.trim() ?? '') : existing.reviewNote,
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
    languages: app.languages,
    bio: app.bio,
    introVideoUrl: app.introVideoUrl,
    timezone: app.timezone,
    moderationFlagged: false,
  };
}
