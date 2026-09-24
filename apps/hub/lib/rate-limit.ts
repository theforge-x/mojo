const WINDOWS = Symbol.for('mojo.hub.rate-limits');

interface Window {
  hits: number[];
}

function store(): Map<string, Window> {
  const globals = globalThis as Record<PropertyKey, unknown>;
  const existing = globals[WINDOWS] as Map<string, Window> | undefined;
  if (existing) return existing;
  const fresh = new Map<string, Window>();
  globals[WINDOWS] = fresh;
  return fresh;
}

/**
 * In-process sliding-window limiter (per dev server instance). Enough to
 * blunt credential-stuffing against the demo auth endpoints; production
 * should sit behind Vercel/Upstash rate limiting.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const windows = store();
  let window = windows.get(key);
  if (!window) {
    window = { hits: [] };
    windows.set(key, window);
  }
  window.hits = window.hits.filter((t) => now - t < windowMs);
  if (window.hits.length >= limit) {
    const oldest = window.hits[0] ?? now;
    return { ok: false, retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000) };
  }
  window.hits.push(now);
  if (windows.size > 10_000) {
    const first = windows.keys().next();
    if (!first.done) windows.delete(first.value);
  }
  return { ok: true };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return 'unknown';
}
