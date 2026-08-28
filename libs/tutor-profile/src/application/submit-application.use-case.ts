import { eventBus } from '@mojo/shared/events';
import type { ApplicationRepository } from '../domain/tutor-profile.ports';
import type { TutorApplication } from '../domain/tutor-profile.types';

export class ApplicationSubmittedError extends Error {
  constructor(id: string) {
    super(`An application for id ${id} has already been submitted.`);
  }
}

export function makeSubmitApplication(deps: { applications: ApplicationRepository }) {
  return async function submitApplication(app: TutorApplication, nowIso: string): Promise<void> {
    const existing = await deps.applications.findById(app.id);
    if (existing) throw new ApplicationSubmittedError(app.id);

    await deps.applications.save(app);
    await eventBus.publish({
      name: 'TutorApplicationSubmitted',
      occurredAt: nowIso,
      payload: { applicationId: app.id, tutorId: app.tutorId },
    });
  };
}
