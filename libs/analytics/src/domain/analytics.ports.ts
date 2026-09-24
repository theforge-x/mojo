export interface AnalyticsRepository {
  countActiveTutors(): Promise<number>;
  countActiveStudents(): Promise<number>;
  sumWalletCreditsMinor(): Promise<number>;
  listLeaderboardCandidates(): Promise<LeaderboardCandidate[]>;
  /**
   * Trial→paid conversion: students with at least one trial session who went
   * on to take at least one paid session, over students with a trial. 0 when
   * no trials exist yet.
   */
  trialToPaidConversionRate(): Promise<number>;
}

export interface LeaderboardCandidate {
  readonly tutorId: string;
  readonly displayName: string;
  readonly responseTimeMinutesAvg: number;
  readonly cancellationRate: number;
}
