# 00 · Executive summary: GoHighLevel integration audit

**Phase:** audit and handoff only. No integration code was written, no CRM records were created, nothing was deployed or pushed.
**Repository:** `creative-studio`, branch `claude/affectionate-sagan-nrj1c8`, audited at commit `b3060af`; pushed to GitHub, and line references re-verified after `6c40065`.

## What exists today (VERIFIED)
- **A static Astro 7.4.7 site** with React 19 islands and **no server runtime, adapter or deployment config**.
- **10 HTML pages:** home, 5 division pages, `/brand`, two legal placeholders, 404. Plus `robots.txt` and a sitemap.
- **One real conversion form:** the project inquiry form (`src/components/InquiryForm.tsx`). It validates in the browser but **sends nothing**, because `PUBLIC_INQUIRY_ENDPOINT` is unset. The UI says so honestly.
- **One assistive widget:** *Ask Moguls*, a local keyword matcher that sends no data and only pre-fills the form.
- **About 120 rendered CTA links** (10 CTA definitions, two repeated per service and one per division), all leading to the inquiry form.
- **No integrations:** no analytics, consent, booking, email/phone/WhatsApp links, newsletter, auth, logging or monitoring.

## What is recommended (PROPOSED)
1. **Keep the custom form** (design, accessibility and pre-fill are already built). Submit it to a **server route `/api/leads`**, which calls HighLevel's API v2 with a **Private Integration Token**.
2. **Contact model:** standard fields plus **13 lean contact custom fields** (preferences, consent, first-touch attribution) and **8 opportunity custom fields** (division, services, budget, qualification, idempotency).
3. **Pipelines:**
   - **Sales — New Business:** 8 open stages; Won and Lost are statuses, not stages.
   - **Client Onboarding:** separate, 4 stages.
   - Delivery stays in a project-management tool.
4. **Workflows** live in GHL: intake + routing, discovery booking, proposal follow-up tasks, onboarding, one re-engagement message, spam handling. No marketing without explicit opt-in.
5. **Booking:** a GHL calendar booking link or embed shown after a successful inquiry. No custom booking API at launch.

## Launch blockers (BLOCKED / NEEDS CONFIRMATION)
1. **Hosting and adapter decision.** A server route is impossible on the current static-only build.
2. **Production domain** (`SITE_URL`). Canonical URLs, the sitemap and Open Graph would otherwise point to localhost.
3. **GHL account configuration:** a PIT with scopes, pipeline and stage IDs, custom fields, workflows and calendar.
4. **Privacy notice, consent wording and terms** (legal review for UAE and any other target markets).
5. **Spam protection** on the lead endpoint.
6. **API details** not confirmable here, because the docs host was blocked: Version header value, several scopes, the notes/tags endpoints, and webhook availability for PITs.

## First implementation step after review
Decide the hosting target. Then add the matching Astro adapter and a single `POST /api/leads` route that validates input and returns a stub `202`, with **no HighLevel call yet**, plus tests. Details: `12-IMPLEMENTATION-PLAN.md`.

Index: `01`–`14` Markdown files, plus `forms-inventory.json`, `crm-field-map.json`, `workflow-specifications.json`, `api-requirements.json` and `.env.highlevel.example`.
