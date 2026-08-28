export type ApplicationStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export interface TutorApplication {
  readonly id: string;
  readonly tutorId: string;
  readonly subjects: readonly string[];
  readonly bio: string;
  readonly introVideoUrl: string;
  readonly certifications: readonly string[];
  readonly status: ApplicationStatus;
  readonly submittedAt: string;
}

export interface TutorProfile {
  readonly tutorId: string;
  readonly displayName: string;
  readonly photoUrl: string;
  readonly subjects: readonly string[];
  readonly bio: string;
  readonly moderationFlagged: boolean;
}
