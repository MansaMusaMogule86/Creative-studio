// Durable lead storage in Supabase through its REST API (PostgREST), called
// server-side with the service-role key. Table: supabase/migrations/*_leads.sql
// (RLS on, no public policies: only the service role can read or write).
import type { Lead } from './schema';
import { fetchWithRetry, UpstreamError, type FetchLike } from './http';

export type StoreConfig = { url: string; serviceRoleKey: string; table: string };
export type CrmStatus = 'pending' | 'sent' | 'failed' | 'skipped';

const headers = (c: StoreConfig, extra: Record<string, string> = {}) => ({
  apikey: c.serviceRoleKey, Authorization: `Bearer ${c.serviceRoleKey}`, 'Content-Type': 'application/json', ...extra,
});

export function toRow(lead: Lead, meta: { ipHash: string; userAgent: string }) {
  return {
    submission_id: lead.submissionId,
    name: lead.name, email: lead.email, company: lead.company || null, phone: lead.phone || null,
    services: lead.services, description: lead.description, budget: lead.budget, contact_channel: lead.contact,
    attribution: lead.attribution, ip_hash: meta.ipHash, user_agent: meta.userAgent.slice(0, 300),
    crm_status: 'pending' as CrmStatus,
  };
}

/** Inserts the lead. Returns 'duplicate' when this submissionId was already stored. */
export async function insertLead(fetcher: FetchLike, c: StoreConfig, row: ReturnType<typeof toRow>): Promise<'created' | 'duplicate'> {
  const res = await fetchWithRetry(fetcher, `${c.url}/rest/v1/${c.table}`, {
    method: 'POST', headers: headers(c, { Prefer: 'return=minimal' }), body: JSON.stringify(row),
  }, { service: 'supabase' });
  if (res.status === 409) return 'duplicate';
  if (!res.ok) throw new UpstreamError('supabase', res.status, `supabase insert failed (${res.status})`);
  return 'created';
}

/** How many leads this IP hash sent since `since` (durable rate limit across instances). */
export async function countRecent(fetcher: FetchLike, c: StoreConfig, ipHash: string, since: Date): Promise<number> {
  const q = `select=id&ip_hash=eq.${encodeURIComponent(ipHash)}&created_at=gte.${encodeURIComponent(since.toISOString())}`;
  const res = await fetchWithRetry(fetcher, `${c.url}/rest/v1/${c.table}?${q}`, {
    method: 'HEAD', headers: headers(c, { Prefer: 'count=exact' }),
  }, { service: 'supabase', retries: 1 });
  if (!res.ok) throw new UpstreamError('supabase', res.status, `supabase count failed (${res.status})`);
  const total = Number((res.headers.get('content-range') ?? '').split('/')[1]);
  return Number.isFinite(total) ? total : 0;
}

export async function markCrm(fetcher: FetchLike, c: StoreConfig, submissionId: string, update: { crm_status: CrmStatus; crm_contact_id?: string | null; crm_error?: string | null }) {
  await fetchWithRetry(fetcher, `${c.url}/rest/v1/${c.table}?submission_id=eq.${encodeURIComponent(submissionId)}`, {
    method: 'PATCH', headers: headers(c, { Prefer: 'return=minimal' }), body: JSON.stringify(update),
  }, { service: 'supabase', retries: 1 });
}
