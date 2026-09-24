import type { TranscriptSummarizer } from '../domain/ai-learning.ports';

const DEFAULT_MODEL = 'gpt-4o-mini';
const TIMEOUT_MS = 15_000;

/**
 * OpenAI-compatible chat summarizer. Posts the transcript to
 * `${baseUrl}/chat/completions` (OpenAI by default, any compatible gateway
 * via `OPENAI_BASE_URL`) and asks for a JSON recap; any failure — missing
 * key, network error, bad payload — falls back to the injected summarizer
 * so recaps degrade instead of breaking session completion.
 */
export class OpenAIChatSummarizer implements TranscriptSummarizer {
  constructor(
    private readonly apiKey: string,
    private readonly fallback: TranscriptSummarizer,
    private readonly model: string = DEFAULT_MODEL,
    private readonly baseUrl: string = 'https://api.openai.com/v1',
  ) {}

  async summarize(transcript: string): Promise<{ summary: string; focusAreas: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.3,
          max_tokens: 400,
          messages: [
            {
              role: 'system',
              content:
                'You summarize tutoring lessons. Reply with JSON only: {"summary": string, "focusAreas": string[]}. Keep the summary under 60 words and list at most 3 focus areas.',
            },
            { role: 'user', content: transcript.slice(0, 6000) },
          ],
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return this.fallback.summarize(transcript);
      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) return this.fallback.summarize(transcript);
      const parsed = JSON.parse(content) as { summary?: unknown; focusAreas?: unknown };
      if (typeof parsed.summary !== 'string' || parsed.summary.trim().length === 0) {
        return this.fallback.summarize(transcript);
      }
      const focusAreas = Array.isArray(parsed.focusAreas)
        ? parsed.focusAreas.filter((f): f is string => typeof f === 'string').slice(0, 3)
        : [];
      return { summary: parsed.summary.trim(), focusAreas };
    } catch {
      return this.fallback.summarize(transcript);
    }
  }
}

/** Returns an OpenAI summarizer when `OPENAI_API_KEY` is set, else the fallback. */
export function summarizerFromEnv(fallback: TranscriptSummarizer): TranscriptSummarizer {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;
  return new OpenAIChatSummarizer(
    apiKey,
    fallback,
    process.env.OPENAI_SUMMARY_MODEL || DEFAULT_MODEL,
    process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  );
}
