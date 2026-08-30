export type ApplicationStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

/**
 * Weekly availability declared by an applicant. Kept inside the tutor-profile
 * domain (not imported from scheduling) so the module boundary — tutor-profile
 * is a SHARED_ONLY module — stays intact; the hub composition root translates
 * these into scheduling `AvailabilityRule`s.
 */
export interface AvailabilityWindow {
  readonly id: string;
  readonly weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  readonly startMinute: number;
  readonly endMinute: number;
}

export interface TutorApplication {
  readonly id: string;
  readonly tutorId: string;
  readonly displayName: string;
  readonly photoUrl: string;
  readonly education: string;
  readonly subjects: readonly string[];
  readonly bio: string;
  readonly introVideoUrl: string;
  readonly certifications: readonly string[];
  readonly timezone: string;
  readonly availability: readonly AvailabilityWindow[];
  readonly status: ApplicationStatus;
  readonly submittedAt: string;
}

export interface TutorProfile {
  readonly tutorId: string;
  readonly displayName: string;
  readonly photoUrl: string;
  readonly education: string;
  readonly subjects: readonly string[];
  readonly bio: string;
  readonly timezone: string;
  readonly moderationFlagged: boolean;
}
