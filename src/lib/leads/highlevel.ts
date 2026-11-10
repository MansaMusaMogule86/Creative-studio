// HighLevel (GoHighLevel) API v2 client, server-only. Uses a Private
// Integration Token for the single Mansas Moguls sub-account.
// Verified paths (docs/ghl-integration/api-requirements.json):
//   POST /contacts/upsert, POST /opportunities/
// Body field names and the notes endpoint are marked NEEDS CONFIRMATION in that
// file: confirm them against the live docs in a HighLevel sandbox before
// switching this on in production (set the HIGHLEVEL_* variables).
import { divisions } from '../../data/divisions';
import type { Lead } from './schema';
import { fetchWithRetry, UpstreamError, type FetchLike } from './http';

export type HighLevelConfig = {
  token: string; locationId: string; apiVersion: string; baseUrl: string;
  pipelineId: string | null; pipelineStageId: string | null;
};

const headers = (c: HighLevelConfig) => ({
  Authorization: `Bearer ${c.token}`, Version: c.apiVersion, Accept: 'application/json', 'Content-Type': 'application/json',
});

export const divisionsFor = (services: string[]) =>
  divisions.filter((d) => d.services.some((s) => services.includes(s.slug))).map((d) => d.slug);

export function contactBody(lead: Lead, c: HighLevelConfig) {
  const [firstName, ...rest] = lead.name.split(/\s+/);
  return {
    locationId: c.locationId,
    firstName, lastName: rest.join(' ') || undefined, name: lead.name,
    email: lead.email, phone: lead.phone || undefined, companyName: lead.company || undefined,
    source: 'Website inquiry',
    tags: ['mm:web-inquiry', ...divisionsFor(lead.services).map((d) => `mm:division:${d}`)],
  };
}

export async function upsertContact(fetcher: FetchLike, c: HighLevelConfig, lead: Lead): Promise<string> {
  const res = await fetchWithRetry(fetcher, `${c.baseUrl}/contacts/upsert`, {
    method: 'POST', headers: headers(c), body: JSON.stringify(contactBody(lead, c)),
  }, { service: 'highlevel' });
  if (!res.ok) throw new UpstreamError('highlevel', res.status, `contact upsert failed (${res.status})`);
  const json = (await res.json().catch(() => ({}))) as { contact?: { id?: string }; id?: string };
  const id = json.contact?.id ?? json.id;
  if (!id) throw new UpstreamError('highlevel', res.status, 'contact upsert returned no id');
  return id;
}

export async function createOpportunity(fetcher: FetchLike, c: HighLevelConfig, lead: Lead, contactId: string): Promise<void> {
  if (!c.pipelineId) return;
  const res = await fetchWithRetry(fetcher, `${c.baseUrl}/opportunities/`, {
    method: 'POST', headers: headers(c),
    body: JSON.stringify({
      locationId: c.locationId, pipelineId: c.pipelineId, ...(c.pipelineStageId ? { pipelineStageId: c.pipelineStageId } : {}),
      name: lead.company || lead.name, status: 'open', contactId, source: 'Website inquiry',
    }),
  }, { service: 'highlevel' });
  if (!res.ok) throw new UpstreamError('highlevel', res.status, `opportunity create failed (${res.status})`);
}

/** Best effort: the enquiry text as a contact note (endpoint NEEDS CONFIRMATION). */
export async function addNote(fetcher: FetchLike, c: HighLevelConfig, contactId: string, lead: Lead): Promise<void> {
  const body = [
    `Website inquiry (${lead.submissionId})`,
    `Services: ${lead.services.join(', ')}`,
    `Budget: ${lead.budget}`,
    `Preferred contact: ${lead.contact}`,
    '', lead.description,
  ].join('\n');
  const res = await fetchWithRetry(fetcher, `${c.baseUrl}/contacts/${encodeURIComponent(contactId)}/notes`, {
    method: 'POST', headers: headers(c), body: JSON.stringify({ body }),
  }, { service: 'highlevel', retries: 1 });
  if (!res.ok) throw new UpstreamError('highlevel', res.status, `note create failed (${res.status})`);
}
