import type { LessonRecap } from './ai-learning.types';

export interface TranscriptSummarizer {
  summarize(transcript: string): Promise<{ summary: string; focusAreas: string[] }>;
}

export interface RecapRepository {
  findBySession(sessionId: string): Promise<LessonRecap | null>;
  save(recap: LessonRecap): Promise<void>;
}
