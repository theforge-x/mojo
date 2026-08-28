import type { RecapRepository, TranscriptSummarizer } from '../domain/ai-learning.ports';
import type { LessonRecap } from '../domain/ai-learning.types';

export class DuplicateRecapError extends Error {
  constructor(sessionId: string) {
    super(`A recap for session ${sessionId} already exists.`);
  }
}

/**
 * Fires on SessionCompleted (wiring at the composition root, per the
 * modular-monolith doc's event table) — depends on a summarizer port and
 * persists the generated recap through a repository port.
 */
export function makeGenerateRecap(deps: {
  recaps: RecapRepository;
  summarizer: TranscriptSummarizer;
}) {
  return async function generateRecap(
    sessionId: string,
    transcript: string,
    nowIso: string,
  ): Promise<LessonRecap> {
    const existing = await deps.recaps.findBySession(sessionId);
    if (existing) throw new DuplicateRecapError(sessionId);

    const { summary, focusAreas } = await deps.summarizer.summarize(transcript);
    const recap: LessonRecap = {
      sessionId,
      summary,
      focusAreas,
      generatedAt: nowIso,
      reviewedByTutor: false,
    };
    await deps.recaps.save(recap);
    return recap;
  };
}
