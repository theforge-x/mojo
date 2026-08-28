export interface PlatformMetrics {
  readonly gmvMinor: number;
  readonly activeTutors: number;
  readonly activeStudents: number;
  readonly trialToPaidConversionRate: number;
  readonly asOf: string;
}

export interface TutorLeaderboardEntry {
  readonly tutorId: string;
  readonly displayName: string;
  readonly responseTimeMinutesAvg: number;
  readonly cancellationRate: number;
  readonly rank: number;
}
