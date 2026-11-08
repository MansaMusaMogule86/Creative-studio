# 14 · Handoff for the implementing agent (ChatGPT)

Read this first. It summarises `00`–`13` and the JSON specs, so you can start without repeating discovery. **Do not implement until the founder approves the plan and answers the blocking decisions in `13`.**

Classification used throughout:
- **VERIFIED:** confirmed in code or by a test run.
- **PROPOSED:** recommended, not implemented.
- **NEEDS CONFIRMATION:** depends on business input or external documentation.
- **BLOCKED:** waiting on a dependency.

## 1. Verified technology stack
- **Astro 7.4.7**, static output, **no adapter**: `astro.config.mjs`.
- React 19.3.1 islands; three 0.187.0 (lazy hero only); GSAP 3.15.1 + ScrollTrigger.
- TypeScript strict. `pnpm lint` and `pnpm check` both run `tsc -p tsconfig.check.json` (`.ts`/`.tsx` only).
- **pnpm**, Node 22 in the dev container.
- Browser QA: `pnpm qa` (`scripts/qa.mjs`, Playwright + axe; needs `pnpm build && pnpm preview` running on port 4321). No unit tests. No CI.
- Environment today: `SITE_URL` (build time; defaults to localhost) and `PUBLIC_INQUIRY_ENDPOINT` (browser-visible). Neither is set.

## 2. Relevant source files
| Purpose | Path |
|---|---|
| Inquiry form (only data capture) | `src/components/InquiryForm.tsx` (validation 17-25, prefill 38-53, payload 69, submit 70-76, prototype notice 94) |
| Where it's mounted | `src/components/Contact.astro:21` (`client:visible`) |
| Ask Moguls (no data sent) | `src/components/AskMoguls.tsx`, `src/lib/intent.ts` |
| Services and slugs (CRM values) | `src/data/divisions.ts` |
| Brand strings, empty email/social | `src/config/brand.ts:22-23` |
| Page head, SEO, JSON-LD | `src/layouts/Base.astro` |
| CTAs | `Header.astro:12,21,36`, `Hero.astro:32,53`, `Services.astro:37`, `universe/[division].astro:31,55`, `Footer.astro:13` |

## 3. Existing conversion points
- **FORM-INQUIRY:** validates, **sends nothing** (no endpoint).
- **Ask Moguls:** pre-fills services only.
- **10 CTA definitions:** all lead to `/#contact` (several with a `?service=` pre-fill).
- **Absent:** booking, newsletter, WhatsApp, email/phone links, analytics, consent.

See `02` and `forms-inventory.json`.

## 4. Proposed CRM architecture
- **Custom form → `POST /api/leads` (server) → HighLevel API v2 with a Private Integration Token.**
- Contact upsert by email. Opportunity in **Sales — New Business / New Lead**. Description goes in a **note**. Tags use the `mm:` prefix.
- Separate **Client Onboarding** pipeline. Delivery is outside GHL.

## 5. Form-to-field mappings
See `03` and `crm-field-map.json`. Rules:
- Custom field keys use the `mm_` prefix and are resolved to IDs at runtime.
- First-touch attribution is written only if empty.
- Never overwrite CRM values with empty values.

## 6. Pipeline configuration (create in GHL by hand)
- **Sales — New Business:** New Lead, Contacting, Discovery Scheduled, Discovery Completed, Qualified, Proposal in Preparation, Proposal Sent, Negotiation. Won and lost are **statuses**; lost requires `mm_opp_lost_reason`.
- **Client Onboarding:** Kickoff Scheduled, Intake Received, Access & Assets, Onboarding Complete.

Put the IDs in the env vars listed below.

## 7. Workflow configuration (GHL UI)
WF-01 to WF-07 in `07` and `workflow-specifications.json`. Rules:
- No marketing without `mm_consent_marketing = true`.
- Automation only moves stages on booking and cancellation.
- Re-entry is off.

## 8. API scopes and endpoint verification
**Open the live docs at https://marketplace.gohighlevel.com/docs before coding.** This audit couldn't reach that host; facts come from search snippets of the official pages.

| Status | Items |
|---|---|
| VERIFIED | Base `https://services.leadconnectorhq.com`; Bearer PIT; `POST /contacts/upsert`; `POST /opportunities/` (required body: pipelineId, locationId, name, status); scope `opportunities.write`; `GET /locations/{locationId}/customFields` with `locations/customFields.readonly`; calendar free-slots and appointments endpoints and scopes; rate limits 100 / 10 s and 200k / day (OAuth context); webhook `X-GHL-Signature` (Ed25519), legacy `X-WH-Signature` deprecated 2026-09-01; PIT rotation every 90 days with a 7-day grace |
| NEEDS CONFIRMATION | `Version` header value (`2021-07-28` in most examples); contacts scopes; upsert body field names and tag handling; notes endpoint; opportunity upsert and pipelines paths; whether `pipelineStageId` is required; rate-limit header names; PIT applicability of rate limits; webhook availability, public key and events |

Full list: `api-requirements.json`.

## 9. Environment variables
From `.env.highlevel.example`. All server-only unless prefixed `PUBLIC_`:

`HIGHLEVEL_API_BASE_URL`, `HIGHLEVEL_API_VERSION`, `HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN`, `HIGHLEVEL_LOCATION_ID`, `HIGHLEVEL_PIPELINE_ID_SALES`, `HIGHLEVEL_STAGE_ID_NEW_LEAD`, `HIGHLEVEL_PIPELINE_ID_ONBOARDING`, `HIGHLEVEL_OWNER_ID_DEFAULT`, `PUBLIC_DISCOVERY_BOOKING_URL`, `HIGHLEVEL_WEBHOOK_PUBLIC_KEY` (later), `LEADS_ALLOWED_ORIGINS`, `LEADS_RATE_LIMIT_PER_MINUTE`, `PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` (optional, needs approval), `PRIVACY_NOTICE_VERSION`, plus the existing `SITE_URL`.

`PUBLIC_INQUIRY_ENDPOINT` is to be **removed** once `/api/leads` exists.

## 10. Security requirements
1. The token is never sent to the browser or written to logs.
2. Server-side validation, with only known service slugs accepted.
3. Origin allow-list; JSON only.
4. Honeypot + minimum fill time + rate limit.
5. Logs carry no PII.
6. Idempotency via `submissionId`.
7. Webhooks (later) verify the signature before parsing.
8. Consent is recorded with its timestamp and notice version.

Details: `09`.

## 11. Implementation order
Steps 0–10 in `12`:
1. Adapter + stub route.
2. Validation and spam protection.
3. Form v2.
4. HighLevel client.
5. Intake service.
6. Test location end-to-end.
7. Workflows.
8. Booking.
9. Analytics.
10. Production — **only with explicit approval**.

## 12. Test cases and acceptance criteria
T1–T12 in `12`. Also: `pnpm lint`, `pnpm build` and `pnpm qa` stay green. The visual design is unchanged (compare screenshots before and after).

## 13. Unresolved decisions
D-01 to D-13 in `13`. Blocking: **D-01 hosting, D-02 domain, D-03 GHL account, D-05 legal/consent**.

## 14. Explicitly excluded (this phase and launch)
- Native GHL embedded forms for the inquiry.
- A custom booking UI on the calendar API.
- Inbound webhooks.
- Newsletter or marketing automation without opt-in.
- Ad pixels and click IDs.
- Real AI in Ask Moguls.
- Any change to the approved visual design or crowned-M branding.
- Creating real CRM records before the test-location step.
- Deployment, purchases and pushing without approval.

## 15. Known blockers
1. No hosting or adapter, so no server route is possible.
2. No domain; `SITE_URL` defaults to localhost.
3. No HighLevel account details (token, location, pipelines, custom fields).
4. No privacy policy, terms or consent wording.
5. The official HighLevel docs couldn't be opened from the audit environment, so the NEEDS CONFIRMATION items above remain.
