import type { TutorPerformance } from './tutor-performance.types';

export interface TutorPerformanceRepository {
  findByTutorId(tutorId: string): Promise<TutorPerformance | null>;
  save(perf: TutorPerformance): Promise<void>;
}
