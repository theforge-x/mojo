import { describe, expect, it } from 'vitest';
import type { RecapRepository, TranscriptSummarizer } from '../domain/ai-learning.ports';
import type { LessonRecap } from '../domain/ai-learning.types';
import { DuplicateRecapError, makeGenerateRecap } from './generate-recap.use-case';

function fakeSummarizer(): TranscriptSummarizer {
  return {
    summarize: async (transcript) => ({
      summary: `Summary of ${transcript.length} chars`,
      focusAreas: ['equations', 'graphs'],
    }),
  };
}

function fakeRecaps(initial: LessonRecap | null = null) {
  let store = initial;
  const repo: RecapRepository = {
    findBySession: async (sessionId) => (store && store.sessionId === sessionId ? store : null),
    save: async (recap) => {
      store = recap;
    },
  };
  return { repo, get: () => store };
}

describe('generateRecap', () => {
  it('summarizes, persists, and returns a recap', async () => {
    const { repo, get } = fakeRecaps();
    const recaps = makeGenerateRecap({ recaps: repo, summarizer: fakeSummarizer() });
    const out = await recaps('s_1', 'a long transcript', '2026-09-01T10:00:00.000Z');
    expect(out.sessionId).toBe('s_1');
    expect(out.reviewedByTutor).toBe(false);
    expect(get()?.summary).toContain('Summary of');
  });

  it('rejects a second recap for the same session', async () => {
    const existing: LessonRecap = {
      sessionId: 's_1',
      summary: 'x',
      focusAreas: [],
      generatedAt: '2026-09-01T09:00:00.000Z',
      reviewedByTutor: true,
    };
    const { repo } = fakeRecaps(existing);
    const generate = makeGenerateRecap({ recaps: repo, summarizer: fakeSummarizer() });
    await expect(generate('s_1', 'a long transcript', '2026-09-01T10:00:00.000Z')).rejects.toThrow(
      DuplicateRecapError,
    );
  });
});
