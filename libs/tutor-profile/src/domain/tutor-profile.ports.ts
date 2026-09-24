import type { TutorApplication, TutorProfile } from './tutor-profile.types';

export interface ApplicationRepository {
  findById(applicationId: string): Promise<TutorApplication | null>;
  list(): Promise<TutorApplication[]>;
  save(application: TutorApplication): Promise<void>;
}

export interface TutorProfileRepository {
  findByTutorId(tutorId: string): Promise<TutorProfile | null>;
  save(profile: TutorProfile): Promise<void>;
}
