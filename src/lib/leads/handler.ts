// POST /api/leads: origin check → size cap → validation → spam → rate limit →
// Odoo (the store of record, crm.mansasmoguls.com) → HighLevel (optional CRM).
// Each destination is switched on by its environment variables. Platform-neutral:
// takes a Web Request, returns a Web Response, so it runs on Vercel Functions and in tests alike.
// Logs carry outcome and timings only: never names, emails, phones or text.
import { parseLead } from './schema';
import { checkSpam, hashIp, MemoryRateLimiter } from './spam';
import { addNote, createOpportunity, upsertContact } from './highlevel';
import { sendToOdoo } from './odoo';
import type { LeadsConfig } from './config';
import { UpstreamError, type FetchLike } from './http';

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

  if (!config.highlevel && !config.odoo) return done(503, { ok: false, code: 'not_configured' }, 'not-configured');

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
  const ipHash = await hashIp(ip, config.ipSalt);
  // Per-instance limit here; Odoo enforces the shared per-visitor limit across instances.
  const limiter = deps.limiter ?? sharedLimiter(config.rateLimitPerMinute);
  if (!limiter.allow(ipHash, now())) return done(429, { ok: false, code: 'rate_limited' }, 'rate-limited');

  const id = lead.submissionId;
  let stored = false;
  let odoo: string | null = null;
  if (config.odoo) {
    try {
      const r = await sendToOdoo(fetcher, config.odoo, lead, raw, {
        sourceUrl: config.siteUrl ?? new URL(req.url).origin, ipHash,
        userAgent: req.headers.get('user-agent') ?? '', receivedAt: new Date(now()),
      });
      odoo = r.outcome;
      // A retried submission Odoo already has: acknowledge it and don't create it in HighLevel again.
      if (r.outcome === 'duplicate') return done(202, { ok: true, duplicate: true }, 'duplicate', { id });
      // 'spam' means Odoo's own fill-time check disagreed (e.g. clock skew): logged below, not stored there.
      if (r.outcome !== 'spam') stored = true;
    } catch (e) {
      const error = String((e as Error).message).slice(0, 200);
      const status = e instanceof UpstreamError ? e.status : 0;
      if (!config.highlevel) {
        return status === 429
          ? done(429, { ok: false, code: 'rate_limited' }, 'odoo-rate-limited', { id })
          : done(503, { ok: false, code: 'unavailable' }, 'odoo-failed', { id, error });
      }
      odoo = 'failed';
      log({ outcome: 'odoo-failed', id, error });
    }
  }

  if (config.highlevel) {
    try {
      const contactId = await upsertContact(fetcher, config.highlevel, lead);
      await createOpportunity(fetcher, config.highlevel, lead, contactId);
      await addNote(fetcher, config.highlevel, contactId, lead).catch(() => undefined);
    } catch (e) {
      const error = String((e as Error).message).slice(0, 200);
      // Stored in Odoo: accept (the team still has it). Not stored anywhere: the visitor must retry.
      if (!stored) return done(503, { ok: false, code: 'unavailable' }, 'crm-failed', { id, error });
      return done(202, { ok: true }, 'stored-highlevel-failed', { id, error });
    }
  }
  return done(202, { ok: true }, 'accepted', { id, stored, odoo, crm: !!config.highlevel });
}
