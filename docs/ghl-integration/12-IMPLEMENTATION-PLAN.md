# 12 · Implementation plan (PROPOSED; run only after approval)

Each step is a small PR that must pass `pnpm lint`, `pnpm build` and `pnpm qa`. **No real CRM writes until step 6**, and then only against a **sandbox or test location**.

| Step | Work | Depends on | Done when |
|---|---|---|---|
| 0 | Decisions D-01 to D-08 (`13`) | Founder | Answers recorded |
| 1 | Add the Astro adapter for the chosen host. `src/pages/api/leads.ts` with `prerender = false` returns a **stub 202**. All pages stay prerendered | D-01 | Build output contains static pages + one function; qa green |
| 2 | `src/lib/leads/schema.ts` (server validation mirroring `InquiryForm.tsx:17-25`), `spam.ts` (honeypot, timing, rate limit), origin check. A unit test runner (vitest, needs approval as a dev dependency) | 1 | Tests for valid, invalid, spam and oversize payloads |
| 3 | Form v2 fields (name split, website, country, language, timeline, consent, hidden attribution, submissionId), keeping the approved design. Submit to `/api/leads`. Remove the `PUBLIC_INQUIRY_ENDPOINT` path | 2, D-05 copy | qa form flow updated; axe passes |
| 4 | `src/lib/integrations/highlevel/*`: config, client (headers, Version, timeouts, retries), errors, fields resolver. **Verify every endpoint and scope on the live docs first** | Docs access, D-03 | Unit tests with a mocked fetch |
| 5 | `service.ts` intake chain: upsert contact → idempotency → opportunity create or note append → tags. Fallback queue | 4, D-01 (queue) | Tests cover partial failure and retry |
| 6 | **Test location:** create the PIT, pipelines, stages and custom fields (by hand in GHL). Run an end-to-end submission | GHL account | Contact, opportunity, note and tags appear correctly; no duplicate on double submit |
| 7 | GHL workflows WF-01, WF-05, WF-07 built in the UI and tested with the test contact | 6, D-04 | Notifications reach the right owner |
| 8 | Booking link (`PUBLIC_DISCOVERY_BOOKING_URL`) + WF-02 | D-06 | Booking moves the stage |
| 9 | Analytics events (`10`) | D-07 | Events seen once each; no PII |
| 10 | Production PIT, env vars set in the host, monitoring, then deploy **only with explicit approval** | All blockers cleared | Launch checklist in `11` all green |

## Test cases and acceptance criteria
| # | Case | Expected |
|---|---|---|
| T1 | Valid inquiry | 202; one contact (upsert), one opportunity at New Lead, a note with the description, tags; UI success |
| T2 | Same submission twice (double click or retry) | One opportunity; at most an extra note |
| T3 | Existing contact, new inquiry the next day | Contact updated (no empty overwrites); a new opportunity |
| T4 | Missing required field / bad email / unknown service slug | 422 with field keys; nothing sent to GHL |
| T5 | Honeypot filled or submitted in under 3 s | 202 to the bot (silently dropped); nothing sent to GHL; logged |
| T6 | Six submissions in one minute from one IP | Sixth gets 429 |
| T7 | GHL returns 429 / 5xx | Retries with backoff; then fallback queue; the visitor still sees success |
| T8 | GHL returns 401 (bad token) | 503 to the visitor; alert raised; no token in logs |
| T9 | Missing custom field key in the account | Fails closed at startup with a clear config error |
| T10 | Marketing consent unticked | `mm_consent_marketing = false`; no marketing tag; WF never sends marketing |
| T11 | Origin header from another site | 403 |
| T12 | Reduced motion, 320 px, axe | Unchanged from today |
