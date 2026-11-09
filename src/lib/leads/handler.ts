// POST /api/leads: origin check → size cap → validation → spam → rate limit →
// Supabase (durable) → HighLevel (CRM). Platform-neutral: takes a Web Request,
// returns a Web Response, so it runs on Vercel Functions and in tests alike.
// Logs carry outcome and timings only: never names, emails, phones or text.
import { parseLead } from './schema';
import { checkSpam, hashIp, MemoryRateLimiter } from './spam';
import { countRecent, insertLead, markCrm, toRow } from './store';
import { addNote, createOpportunity, upsertContact } from './highlevel';
import type { LeadsConfig } from './config';
import type { FetchLike } from './http';

export const MAX_BODY_BYTES = 16 * 1024;

export type Deps = { config: LeadsConfig; fetcher?: FetchLike; limiter?: MemoryRateLimiter; now?: () => number; log?: (entry: Record<string, unknown>) => void };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const limiters = new Map<number, MemoryRateLimiter>();
const sharedLimiter = (n: number) => { let l = limiters.get(n); if (!l) limiters.set(n, (l = new MemoryRateLimiter(n))); return l; };

function originAllowed(req: Request, siteUrl: string | null): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin form posts from some browsers omit it; other checks still apply
  const allowed = new Set([new URL(req.url).origin]);
  if (siteUrl) { try { allowed.add(new URL(siteUrl).origin); } catch { /* ignore bad SITE_URL */ } }
  return allowed.has(origin);
}

export async function handleLeadRequest(req: Request, deps: Deps): Promise<Response> {
  const t0 = Date.now();
  const { config } = deps;
  const fetcher = deps.fetcher ?? ((u: string, i?: RequestInit) => fetch(u, i));
  const now = deps.now ?? Date.now;
  const log = deps.log ?? ((e) => console.log(JSON.stringify({ at: 'api/leads', ...e })));
  const done = (status: number, body: unknown, outcome: string, extra: Record<string, unknown> = {}) => {
    log({ outcome, status, ms: Date.now() - t0, ...extra });
    return json(status, body);
  };

  if (req.method !== 'POST') return done(405, { ok: false, code: 'method_not_allowed' }, 'method');
  if (!originAllowed(req, config.siteUrl)) return done(403, { ok: false, code: 'forbidden' }, 'origin');
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) return done(415, { ok: false, code: 'unsupported_media_type' }, 'content-type');
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return done(413, { ok: false, code: 'too_large' }, 'too-large');
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return done(413, { ok: false, code: 'too_large' }, 'too-large');

  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return done(400, { ok: false, code: 'bad_json' }, 'bad-json'); }
  const parsed = parseLead(raw);
  if (!parsed.ok) return done(422, { ok: false, code: 'invalid', errors: parsed.errors }, 'invalid', { fields: Object.keys(parsed.errors) });
  const lead = parsed.lead;

  // Bots get a normal-looking success so they learn nothing; nothing is stored.
  const spam = checkSpam(lead, now());
  if (spam.spam) return done(202, { ok: true }, 'spam', { reason: spam.reason });

  if (!config.supabase && !config.highlevel) return done(503, { ok: false, code: 'not_configured' }, 'not-configured');

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  const ipHash = await hashIp(ip, config.ipSalt);
  const limiter = deps.limiter ?? sharedLimiter(config.rateLimitPerMinute);
  if (!limiter.allow(ipHash, now())) return done(429, { ok: false, code: 'rate_limited' }, 'rate-limited');
  if (config.supabase) {
    try {
      const recent = await countRecent(fetcher, config.supabase, ipHash, new Date(now() - 60_000));
      if (recent >= config.rateLimitPerMinute) return done(429, { ok: false, code: 'rate_limited' }, 'rate-limited-durable');
    } catch { /* fail open: the memory limiter still applies */ }
  }

  const id = lead.submissionId;
  let stored = false;
  if (config.supabase) {
    try {
      const r = await insertLead(fetcher, config.supabase, toRow(lead, { ipHash, userAgent: req.headers.get('user-agent') ?? '' }));
      if (r === 'duplicate') return done(202, { ok: true, duplicate: true }, 'duplicate', { id });
      stored = true;
    } catch (e) {
      if (!config.highlevel) return done(503, { ok: false, code: 'unavailable' }, 'store-failed', { id, error: String((e as Error).message) });
    }
  }

  if (config.highlevel) {
    try {
      const contactId = await upsertContact(fetcher, config.highlevel, lead);
      await createOpportunity(fetcher, config.highlevel, lead, contactId);
      await addNote(fetcher, config.highlevel, contactId, lead).catch(() => undefined);
      if (stored && config.supabase) await markCrm(fetcher, config.supabase, id, { crm_status: 'sent', crm_contact_id: contactId }).catch(() => undefined);
    } catch (e) {
      const error = String((e as Error).message).slice(0, 200);
      // Stored safely: accept and leave it marked for replay. Not stored: the visitor must retry.
      if (!stored) return done(503, { ok: false, code: 'unavailable' }, 'crm-failed', { id, error });
      if (config.supabase) await markCrm(fetcher, config.supabase, id, { crm_status: 'failed', crm_error: error }).catch(() => undefined);
      return done(202, { ok: true }, 'stored-crm-queued', { id, error });
    }
  } else if (stored && config.supabase) {
    await markCrm(fetcher, config.supabase, id, { crm_status: 'skipped' }).catch(() => undefined);
  }
  return done(202, { ok: true }, 'accepted', { id, stored, crm: !!config.highlevel });
}
