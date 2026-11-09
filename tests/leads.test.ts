import { describe, expect, it } from 'vitest';
import { parseLead, validateFields, type LeadPayload } from '../src/lib/leads/schema';
import { checkSpam, hashIp, MemoryRateLimiter, MIN_FILL_MS } from '../src/lib/leads/spam';
import { fetchWithRetry, UpstreamError } from '../src/lib/leads/http';
import { handleLeadRequest, MAX_BODY_BYTES } from '../src/lib/leads/handler';
import { readConfig, type LeadsConfig } from '../src/lib/leads/config';

const NOW = 1_800_000_000_000;
const ID = '3f2b8a4e-1c2d-4e5f-9a8b-7c6d5e4f3a2b';
const good = (over: Partial<LeadPayload> = {}): LeadPayload => ({
  name: 'Amina Rahman', email: 'Amina@Example.com', company: 'Example Co', services: ['premium-websites', 'ai-agents'],
  description: 'We need a new website and an AI assistant for our sales team.', budget: 'USD 25k–75k', contact: 'email', phone: '',
  submissionId: ID, startedAt: NOW - 30_000, website: '', attribution: { utm_source: 'linkedin', landing_path: '/' }, ...over,
});

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };
function mockFetch(routes: (c: Call) => Response | undefined) {
  const calls: Call[] = [];
  const fetcher = async (url: string, init: RequestInit = {}) => {
    const c: Call = { url, method: init.method ?? 'GET', headers: Object.fromEntries(new Headers(init.headers).entries()), body: init.body ? JSON.parse(String(init.body)) : undefined };
    calls.push(c);
    return routes(c) ?? new Response('{}', { status: 200 });
  };
  return { fetcher, calls };
}
const cfg = (over: Partial<LeadsConfig> = {}): LeadsConfig => ({
  siteUrl: 'https://mansasmoguls.com', rateLimitPerMinute: 5, ipSalt: 'test-salt',
  supabase: { url: 'https://proj.supabase.co', serviceRoleKey: 'service-key', table: 'leads' },
  highlevel: null, ...over,
});
const GHL = { token: 'pit-token', locationId: 'loc_1', apiVersion: '2021-07-28', baseUrl: 'https://services.leadconnectorhq.com', pipelineId: 'pipe_1', pipelineStageId: 'stage_1' };
const req = (body: unknown, headers: Record<string, string> = {}, method = 'POST') =>
  new Request('https://mansasmoguls.com/api/leads', {
    method, body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    headers: { 'content-type': 'application/json', origin: 'https://mansasmoguls.com', 'x-forwarded-for': '203.0.113.9, 10.0.0.1', 'user-agent': 'vitest', ...headers },
  });
const run = (r: Request, config: LeadsConfig, fetcher: ReturnType<typeof mockFetch>['fetcher'], limit = new MemoryRateLimiter(config.rateLimitPerMinute)) =>
  handleLeadRequest(r, { config, fetcher, limiter: limit, now: () => NOW, log: () => {} });

describe('schema (shared by form and server)', () => {
  it('accepts a valid lead and normalises it', () => {
    const r = parseLead({ ...good(), name: '  Amina Rahman ', email: ' Amina@Example.com ' });
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.lead.email).toBe('amina@example.com'); expect(r.lead.name).toBe('Amina Rahman'); expect(r.lead.honeypot).toBe(''); }
  });
  it('rejects unknown keys', () => expect(parseLead({ ...good(), isAdmin: true }).ok).toBe(false));
  it('rejects non-objects', () => { expect(parseLead(null).ok).toBe(false); expect(parseLead([1]).ok).toBe(false); });
  it('rejects unknown service slugs', () => {
    const r = parseLead(good({ services: ['not-a-service'] }));
    expect(r.ok).toBe(false); if (!r.ok) expect(r.errors.services).toBeTruthy();
  });
  it('requires a phone number only for the phone channel', () => {
    expect(validateFields({ ...good(), contact: 'phone', phone: '' }).phone).toBeTruthy();
    expect(validateFields({ ...good(), contact: 'phone', phone: '+971 50 123 4567' }).phone).toBeUndefined();
    expect(validateFields({ ...good(), contact: 'email', phone: '' }).phone).toBeUndefined();
  });
  it('enforces length limits', () => {
    expect(validateFields({ ...good(), description: 'too short' }).description).toBeTruthy();
    expect(validateFields({ ...good(), description: 'x'.repeat(4001) }).description).toBeTruthy();
    expect(validateFields({ ...good(), name: 'x'.repeat(121) }).name).toBeTruthy();
  });
  it('rejects a missing or malformed submissionId', () => expect(parseLead(good({ submissionId: 'abc' })).ok).toBe(false));
  it('keeps only known attribution keys, capped', () => {
    const r = parseLead(good({ attribution: { utm_source: 'x'.repeat(500), evil: 'y' } as never }));
    expect(r.ok).toBe(true); if (r.ok) { expect(r.lead.attribution.utm_source).toHaveLength(200); expect(r.lead.attribution).not.toHaveProperty('evil'); }
  });
  it('strips control characters', () => {
    const r = parseLead(good({ company: 'Acme\u0000\u0007 Ltd' }));
    expect(r.ok && r.lead.company).toBe('Acme Ltd');
  });
});

describe('spam controls', () => {
  it('flags the honeypot', () => expect(checkSpam({ honeypot: 'http://spam', startedAt: NOW - 60_000 }, NOW)).toEqual({ spam: true, reason: 'honeypot' }));
  it('flags forms filled faster than a person can', () => expect(checkSpam({ honeypot: '', startedAt: NOW - (MIN_FILL_MS - 1) }, NOW).spam).toBe(true));
  it('flags stale timestamps', () => expect(checkSpam({ honeypot: '', startedAt: NOW - 2 * 86_400_000 }, NOW)).toEqual({ spam: true, reason: 'stale' }));
  it('passes a normal submission', () => expect(checkSpam({ honeypot: '', startedAt: NOW - 20_000 }, NOW).spam).toBe(false));
  it('hashes IPs with a salt (no raw IP)', async () => {
    const a = await hashIp('203.0.113.9', 's1'), b = await hashIp('203.0.113.9', 's2');
    expect(a).toMatch(/^[0-9a-f]{64}$/); expect(a).not.toBe(b); expect(a).not.toContain('203');
  });
  it('rate-limits per key in a sliding window', () => {
    const l = new MemoryRateLimiter(2, 60_000);
    expect(l.allow('k', NOW)).toBe(true); expect(l.allow('k', NOW + 1)).toBe(true); expect(l.allow('k', NOW + 2)).toBe(false);
    expect(l.allow('other', NOW + 3)).toBe(true);
    expect(l.allow('k', NOW + 60_003)).toBe(true);
  });
});

describe('fetchWithRetry', () => {
  const noSleep = { sleep: async () => {} };
  it('retries 429 and 5xx, then succeeds', async () => {
    let n = 0;
    const res = await fetchWithRetry(async () => new Response('', { status: ++n < 3 ? (n === 1 ? 429 : 503) : 200 }), 'u', {}, { service: 't', ...noSleep });
    expect(res.status).toBe(200); expect(n).toBe(3);
  });
  it('does not retry other 4xx', async () => {
    let n = 0;
    const res = await fetchWithRetry(async () => { n++; return new Response('', { status: 400 }); }, 'u', {}, { service: 't', ...noSleep });
    expect(res.status).toBe(400); expect(n).toBe(1);
  });
  it('gives up after the retry budget with a typed error', async () => {
    await expect(fetchWithRetry(async () => new Response('', { status: 500 }), 'u', {}, { service: 't', retries: 2, ...noSleep })).rejects.toBeInstanceOf(UpstreamError);
  });
  it('treats network failures as retryable', async () => {
    let n = 0;
    const res = await fetchWithRetry(async () => { if (++n === 1) throw new Error('ECONNRESET'); return new Response('', { status: 200 }); }, 'u', {}, { service: 't', ...noSleep });
    expect(res.status).toBe(200);
  });
});

describe('config', () => {
  it('stays off until keys are set, and never needs PUBLIC_ variables', () => {
    const c = readConfig({});
    expect(c.supabase).toBeNull(); expect(c.highlevel).toBeNull(); expect(c.rateLimitPerMinute).toBe(5);
  });
  it('reads Supabase and HighLevel settings', () => {
    const c = readConfig({ SUPABASE_URL: 'https://p.supabase.co/', SUPABASE_SERVICE_ROLE_KEY: 'k', HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN: 't', HIGHLEVEL_LOCATION_ID: 'l', LEADS_RATE_LIMIT_PER_MINUTE: '3' });
    expect(c.supabase?.url).toBe('https://p.supabase.co'); expect(c.highlevel?.apiVersion).toBe('2021-07-28'); expect(c.rateLimitPerMinute).toBe(3);
  });
});

describe('POST /api/leads', () => {
  const supaOk = (c: Call) => (c.url.includes('supabase.co') ? (c.method === 'HEAD' ? new Response(null, { status: 200, headers: { 'content-range': '*/0' } }) : new Response(null, { status: 201 })) : undefined);

  it('rejects other methods, foreign origins and non-JSON', async () => {
    const { fetcher } = mockFetch(() => undefined);
    expect((await run(req(null, {}, 'GET'), cfg(), fetcher)).status).toBe(405);
    expect((await run(req(good(), { origin: 'https://evil.example' }), cfg(), fetcher)).status).toBe(403);
    expect((await run(req(good(), { 'content-type': 'text/plain' }), cfg(), fetcher)).status).toBe(415);
  });
  it('caps the body size', async () => {
    const { fetcher } = mockFetch(() => undefined);
    expect((await run(req('x'.repeat(MAX_BODY_BYTES + 1)), cfg(), fetcher)).status).toBe(413);
  });
  it('returns 400 for malformed JSON and 422 with field keys for invalid input', async () => {
    const { fetcher } = mockFetch(() => undefined);
    expect((await run(req('{oops'), cfg(), fetcher)).status).toBe(400);
    const r = await run(req(good({ email: 'nope' })), cfg(), fetcher);
    expect(r.status).toBe(422); expect((await r.json()).errors.email).toBeTruthy();
  });
  it('quietly accepts spam without storing anything', async () => {
    const { fetcher, calls } = mockFetch(() => undefined);
    const r = await run(req(good({ website: 'http://spam.example' })), cfg(), fetcher);
    expect(r.status).toBe(202); expect(calls).toHaveLength(0);
  });
  it('says not_configured when no delivery is set up', async () => {
    const { fetcher } = mockFetch(() => undefined);
    const r = await run(req(good()), cfg({ supabase: null, highlevel: null }), fetcher);
    expect(r.status).toBe(503); expect((await r.json()).code).toBe('not_configured');
  });
  it('stores the lead in Supabase (contract) without the raw IP', async () => {
    const { fetcher, calls } = mockFetch(supaOk);
    const r = await run(req(good()), cfg(), fetcher);
    expect(r.status).toBe(202);
    const insert = calls.find((c) => c.method === 'POST')!;
    expect(insert.url).toBe('https://proj.supabase.co/rest/v1/leads');
    expect(insert.headers.apikey).toBe('service-key'); expect(insert.headers.authorization).toBe('Bearer service-key');
    const row = insert.body as Record<string, unknown>;
    expect(row).toMatchObject({ submission_id: ID, email: 'amina@example.com', services: ['premium-websites', 'ai-agents'], contact_channel: 'email', crm_status: 'pending' });
    expect(JSON.stringify(row)).not.toContain('203.0.113.9');
    expect(row.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(calls.some((c) => c.method === 'PATCH' && (c.body as { crm_status: string }).crm_status === 'skipped')).toBe(true);
  });
  it('treats a repeated submissionId as a duplicate (idempotent)', async () => {
    const { fetcher, calls } = mockFetch((c) => (c.method === 'POST' && c.url.includes('supabase') ? new Response('', { status: 409 }) : supaOk(c)));
    const r = await run(req(good()), cfg({ highlevel: GHL }), fetcher);
    expect(r.status).toBe(202); expect((await r.json()).duplicate).toBe(true);
    expect(calls.some((c) => c.url.includes('leadconnectorhq'))).toBe(false);
  });
  it('rate-limits per IP in memory and durably via Supabase counts', async () => {
    const { fetcher } = mockFetch(supaOk);
    const limiter = new MemoryRateLimiter(1);
    expect((await run(req(good()), cfg(), fetcher, limiter)).status).toBe(202);
    expect((await run(req(good({ submissionId: '4f2b8a4e-1c2d-4e5f-9a8b-7c6d5e4f3a2b' })), cfg(), fetcher, limiter)).status).toBe(429);
    const busy = mockFetch((c) => (c.method === 'HEAD' ? new Response(null, { status: 200, headers: { 'content-range': '*/5' } }) : supaOk(c)));
    expect((await run(req(good()), cfg(), busy.fetcher)).status).toBe(429);
  });
  it('sends the contact and opportunity to HighLevel (contract)', async () => {
    const { fetcher, calls } = mockFetch((c) => {
      if (c.url.endsWith('/contacts/upsert')) return new Response(JSON.stringify({ contact: { id: 'ct_9' } }), { status: 200 });
      if (c.url.endsWith('/opportunities/')) return new Response('{}', { status: 201 });
      if (c.url.endsWith('/contacts/ct_9/notes')) return new Response('{}', { status: 201 });
      return supaOk(c);
    });
    const r = await run(req(good()), cfg({ highlevel: GHL }), fetcher);
    expect(r.status).toBe(202);
    const up = calls.find((c) => c.url.endsWith('/contacts/upsert'))!;
    expect(up.headers.authorization).toBe('Bearer pit-token'); expect(up.headers.version).toBe('2021-07-28');
    expect(up.body).toMatchObject({ locationId: 'loc_1', firstName: 'Amina', lastName: 'Rahman', email: 'amina@example.com', tags: ['mm:web-inquiry', 'mm:division:digital', 'mm:division:ai'] });
    const opp = calls.find((c) => c.url.endsWith('/opportunities/'))!;
    expect(opp.body).toMatchObject({ pipelineId: 'pipe_1', pipelineStageId: 'stage_1', contactId: 'ct_9', status: 'open', name: 'Example Co' });
    expect(calls.some((c) => c.method === 'PATCH' && (c.body as { crm_status: string }).crm_status === 'sent')).toBe(true);
  });
  it('keeps the lead when HighLevel is down (stored, marked failed for replay)', async () => {
    const { fetcher, calls } = mockFetch((c) => (c.url.includes('leadconnectorhq') ? new Response('', { status: 500 }) : supaOk(c)));
    const r = await handleLeadRequest(req(good()), { config: cfg({ highlevel: { ...GHL } }), fetcher, limiter: new MemoryRateLimiter(5), now: () => NOW, log: () => {} });
    expect(r.status).toBe(202);
    expect(calls.some((c) => c.method === 'PATCH' && (c.body as { crm_status: string }).crm_status === 'failed')).toBe(true);
  }, 20_000);
  it('asks the visitor to retry when nothing could be stored', async () => {
    const down = mockFetch(() => new Response('', { status: 500 }));
    expect((await run(req(good()), cfg(), down.fetcher)).status).toBe(503);
  }, 20_000);
});
