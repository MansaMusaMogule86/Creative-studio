// Spam and abuse controls for /api/leads: honeypot, minimum fill time and a
// per-IP rate limit. IPs are never stored in plain text, only as salted hashes.

/** Real visitors need at least this long to fill in the form. */
export const MIN_FILL_MS = 3000;
/** Anything older than this is a replayed or forged timestamp. */
export const MAX_FILL_MS = 24 * 60 * 60 * 1000;

export type SpamVerdict = { spam: false } | { spam: true; reason: 'honeypot' | 'too-fast' | 'stale' };

export function checkSpam(lead: { honeypot: string; startedAt: number }, now = Date.now()): SpamVerdict {
  if (lead.honeypot) return { spam: true, reason: 'honeypot' };
  const elapsed = now - lead.startedAt;
  if (!lead.startedAt || elapsed < MIN_FILL_MS) return { spam: true, reason: 'too-fast' };
  if (elapsed > MAX_FILL_MS) return { spam: true, reason: 'stale' };
  return { spam: false };
}

/** SHA-256(salt + ip), hex. Uses Web Crypto (Node 18+, Vercel, browsers). */
export async function hashIp(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sliding-window limiter held in memory. On serverless each instance has its
 * own window, so the durable check in the store (count of recent rows per IP
 * hash) backs it up when Supabase is configured.
 */
export class MemoryRateLimiter {
  private hits = new Map<string, number[]>();
  constructor(private limit: number, private windowMs = 60_000) {}
  allow(key: string, now = Date.now()): boolean {
    const from = now - this.windowMs;
    const list = (this.hits.get(key) ?? []).filter((t) => t > from);
    if (list.length >= this.limit) { this.hits.set(key, list); return false; }
    list.push(now);
    this.hits.set(key, list);
    if (this.hits.size > 5000) for (const [k, v] of this.hits) if (!v.some((t) => t > from)) this.hits.delete(k);
    return true;
  }
}
