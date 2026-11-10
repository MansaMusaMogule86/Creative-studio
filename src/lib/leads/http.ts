// fetch with a timeout and retries on 429/5xx (exponential backoff + jitter).
// No retry on other 4xx: those are request errors that will not fix themselves.
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class UpstreamError extends Error {
  constructor(public service: string, public status: number, message: string) { super(message); this.name = 'UpstreamError'; }
}

export async function fetchWithRetry(
  fetcher: FetchLike, url: string, init: RequestInit,
  { service, retries = 3, timeoutMs = 8000, baseDelayMs = 500, sleep = (ms: number) => new Promise((r) => setTimeout(r, ms)) }:
  { service: string; retries?: number; timeoutMs?: number; baseDelayMs?: number; sleep?: (ms: number) => Promise<unknown> },
): Promise<Response> {
  let last: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetcher(url, { ...init, signal: ctrl.signal });
      if (res.status !== 429 && res.status < 500) return res;
      last = new UpstreamError(service, res.status, `${service} responded ${res.status}`);
      const retryAfter = Number(res.headers.get('retry-after'));
      if (attempt < retries) await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 5000) : baseDelayMs * 2 ** attempt * (0.75 + Math.random() * 0.5));
    } catch (e) {
      last = e;
      if (attempt < retries) await sleep(baseDelayMs * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  if (last instanceof UpstreamError) throw last;
  throw new UpstreamError(service, 0, `${service} unreachable`);
}
