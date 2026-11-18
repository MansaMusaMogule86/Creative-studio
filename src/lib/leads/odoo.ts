// Odoo (crm.mansasmoguls.com) delivery, server-only. Posts the inquiry to the
// mansas_form_submissions module (odoo19_form_submissions/), which stores it as
// a Website Form Submission, independent of CRM leads.
// Auth: `Authorization: Bearer <ODOO_API_KEY>`, a key generated in Odoo under
// Website Submissions → Configuration → API Keys. Never sent to the browser.
// Retries are safe: Odoo de-duplicates on submissionId.
import type { Lead } from './schema';
import { fetchWithRetry, UpstreamError, type FetchLike } from './http';

export type OdooConfig = { baseUrl: string; apiKey: string; database: string | null };

export const ODOO_SUBMISSIONS_PATH = '/api/mansas/v1/form-submissions';

export type OdooMeta = { sourceUrl: string | null; ipHash: string; userAgent: string; receivedAt: Date };

/** The envelope the Odoo module expects: the browser's original payload plus server-side metadata. */
export function odooBody(raw: unknown, meta: OdooMeta) {
  return {
    submission: raw,
    meta: {
      ...(meta.sourceUrl ? { source_url: meta.sourceUrl } : {}),
      client_ip_hash: meta.ipHash,
      ...(meta.userAgent ? { user_agent: meta.userAgent.slice(0, 300) } : {}),
      received_at: meta.receivedAt.toISOString(),
    },
  };
}

export type OdooResult = { reference: string | null; outcome: 'created' | 'duplicate' | 'spam' };

/** Sends the submission. Resolves when Odoo has stored it (or already had it); throws UpstreamError otherwise. */
export async function sendToOdoo(fetcher: FetchLike, c: OdooConfig, lead: Lead, raw: unknown, meta: OdooMeta): Promise<OdooResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${c.apiKey}`, Accept: 'application/json', 'Content-Type': 'application/json',
  };
  if (c.database) headers['X-Odoo-Database'] = c.database;
  const res = await fetchWithRetry(fetcher, `${c.baseUrl}${ODOO_SUBMISSIONS_PATH}`, {
    method: 'POST', headers, body: JSON.stringify(odooBody(raw, meta)),
  }, { service: 'odoo', retries: 2 });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; reference?: string; duplicate?: boolean; code?: string };
  // 201 created, 200 duplicate, 202 Odoo judged it spam (acknowledged, not stored).
  if (res.ok && json.ok) {
    const outcome = res.status === 202 ? 'spam' : json.duplicate ? 'duplicate' : 'created';
    return { reference: json.reference ?? null, outcome };
  }
  throw new UpstreamError('odoo', res.status, `odoo rejected the submission (${res.status} ${json.code ?? 'unknown'}) for ${lead.submissionId}`);
}
