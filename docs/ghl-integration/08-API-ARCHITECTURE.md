# 08 · API architecture

Machine-readable: `api-requirements.json`.

**Verification note:** `marketplace.gohighlevel.com` was **blocked by this environment's network policy**, so the official pages could not be opened directly. Facts below marked *VERIFIED* come from official doc pages as quoted in web search results. Anything else is **NEEDS CONFIRMATION** and must be checked on the live docs before coding.

## Authentication
- **Private Integration Token (PIT)**, recommended, for one sub-account and server-to-server calls. The docs describe it as bearer auth, static (no auto-refresh), shown once and bound to one sub-account. Rotation is recommended every 90 days; "rotate and expire later" gives a 7-day grace. *VERIFIED.*
- OAuth 2.0 is only needed for a multi-location marketplace app. *Not needed.*
- The token lives only in server environment variables (`HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN`). **It must never be `PUBLIC_*`.** It is never logged and never returned to the browser.

## Requests
- **Base:** `https://services.leadconnectorhq.com` *(VERIFIED)*
- **Headers:** `Authorization: Bearer <PIT>`, `Version: <date>` (required; value `2021-07-28` per most examples, **NEEDS CONFIRMATION**), `Accept` / `Content-Type: application/json`

| Need | Endpoint | Scope | Status |
|---|---|---|---|
| Upsert contact | `POST /contacts/upsert` | contacts.write (?) | Path VERIFIED; scope and body field names NEEDS CONFIRMATION. Honours the location's "Allow Duplicate Contact" setting |
| Create opportunity | `POST /opportunities/` | opportunities.write | VERIFIED; required body: pipelineId, locationId, name, status |
| Find or upsert opportunity | "Upsert Opportunity" doc page | ? | NEEDS CONFIRMATION |
| Pipelines and stage IDs (setup script) | "Pipelines" doc page | opportunities.readonly (?) | NEEDS CONFIRMATION |
| Custom field IDs by key | `GET /locations/{locationId}/customFields` | locations/customFields.readonly | VERIFIED |
| Add note | ? | ? | NEEDS CONFIRMATION |
| Add tags | ? (or the upsert body) | ? | NEEDS CONFIRMATION |
| Add to workflow (not needed) | `POST /contacts/{contactId}/workflow/{workflowId}` | ? | Path VERIFIED |
| Free slots / book (not at launch) | `GET /calendars/{calendarId}/free-slots`, `POST /calendars/events/appointments` | calendars.readonly, calendars/events.write | VERIFIED |

- **Rate limits:** 100 requests per 10 seconds and 200,000 per day per resource; 429 when exceeded. *VERIFIED for OAuth*; applicability to PITs NEEDS CONFIRMATION. One enquiry is ≤ 5 calls.
- **Pagination:** only setup scripts list pipelines and fields. Use the cursor or limit parameters documented per endpoint (NEEDS CONFIRMATION).

## Reliability
| Concern | Design |
|---|---|
| Retries | On 429 and 5xx: exponential backoff with jitter (0.5 s, 1 s, 2 s; max 3), honouring rate-limit headers. No retry on 4xx validation errors |
| Idempotency | Browser UUID `submissionId` stored in `mm_submission_id`; server-side dedupe window of 10 minutes (see `05`) |
| Partial failure | Contact created but opportunity failed: retry the opportunity only; store the contact ID |
| CRM unavailable | Accept the lead (202), write it to a durable fallback (platform queue or KV, or an email to a monitored inbox: **NEEDS CONFIRMATION** by host) and replay later |
| Custom field IDs | Resolved by key once per cold start, cached in memory; fail closed if a required key is missing |
| Errors | Typed errors (`ValidationError`, `RateLimited`, `Upstream`, `Config`) → HTTP 422 / 429 / 503 / 500 with no upstream details leaked |
| Audit logging | Structured log per submission: submissionId, outcome, timings, GHL IDs. **No names, emails, phones or descriptions** |

## Proposed code layout (not created)
Adapted to Astro with an adapter. Only `api/*` routes are server-rendered (`export const prerender = false`).
```
src/lib/integrations/highlevel/
  config.ts        env parsing (server-only), fail fast
  client.ts        fetch wrapper: base URL, headers, Version, timeout, retries
  errors.ts        typed errors
  types.ts         request/response types (from verified docs only)
  fields.ts        custom-field key → id resolution + cache
  contacts.ts      upsertContact(), addNote(), addTags()
  opportunities.ts createOrAppendOpportunity()
  calendars.ts     (later)
  webhooks.ts      (later) signature verification
src/lib/leads/
  schema.ts        server-side validation (mirrors InquiryForm rules)
  attribution.ts   sanitise utm/landing/referrer
  spam.ts          honeypot, timing, rate limit
  service.ts       orchestrates the intake chain
src/pages/api/
  leads.ts         POST: origin check → validate → spam → service → 202/422/429/503
  webhooks/highlevel.ts  (later)
tests/
  leads.schema.test.ts, leads.service.test.ts (mocked client), highlevel.client.test.ts
```
`InquiryForm.tsx` changes only its submit target (from `PUBLIC_INQUIRY_ENDPOINT` to `/api/leads`) and adds the v2 fields. The visual design is unchanged.
