export interface AnalyticsRepository {
  countActiveTutors(): Promise<number>;
  countActiveStudents(): Promise<number>;
  sumWalletCreditsMinor(): Promise<number>;
  listLeaderboardCandidates(): Promise<LeaderboardCandidate[]>;
}

export interface LeaderboardCandidate {
  readonly tutorId: string;
  readonly displayName: string;
  readonly responseTimeMinutesAvg: number;
  readonly cancellationRate: number;
}
