export interface LessonRecap {
  readonly sessionId: string;
  readonly summary: string;
  readonly focusAreas: readonly string[];
  readonly generatedAt: string;
  readonly reviewedByTutor: boolean;
}

export interface PracticeItem {
  readonly id: string;
  readonly sessionId: string;
  readonly studentId: string;
  readonly kind: 'daily_exercise' | 'scenario_drill';
  readonly prompt: string;
  readonly completedAt: string | null;
}
