# 10 · Analytics and attribution

## Current state (VERIFIED)
**No analytics, tag manager, pixels, cookies or consent banner.** A grep of `src/` for `gtag`, `dataLayer`, `analytics` and `cookie` finds only copy text. Lighthouse Best Practices scores 100.

## Measurement plan (PROPOSED)
Provider: **NEEDS CONFIRMATION.** A privacy-friendly, cookieless tool avoids a consent banner in some jurisdictions; GA4 needs consent mode. Event names are provider-neutral, snake_case:

| Event | When | Properties (no PII) | Fires from |
|---|---|---|---|
| `page_view` | Each page | path, locale | Client |
| `cta_click` | Any CTA in `forms-inventory.json` | `cta_id`, `location`, `division?` | Client (`data-cta` attribute) |
| `ask_open` | Ask Moguls opened | `entry` (launcher/hero) | Client |
| `ask_match` | Ask Moguls returned results | `division`, `match_count` (**never the query text**) | Client |
| `form_start` | First interaction with the inquiry form | `prefilled` (bool) | Client |
| `form_submit_attempt` | Submit pressed | `services_count` | Client |
| `form_validation_error` | Client errors | `fields[]` (keys only) | Client |
| `generate_lead` | Server responded 2xx | `division`, `budget_band`, `lead_source_detail` | Client, after the response |
| `booking_click` | "Book a discovery call" | — | Client |
| `booking_complete` | GHL booking confirmed | — | Booking page redirect or GHL (NEEDS CONFIRMATION) |
| `qualified_lead`, `opportunity_won` | CRM stage or status | `division`, value band | **Offline from the CRM later**; not on the website |

Duplicate prevention:
- `generate_lead` fires once per `submissionId`.
- `form_start` fires once per page view.
- Never fire `generate_lead` on the client before the server confirms.

## Attribution flow into the CRM
1. On the first page of a session, read `utm_source/medium/campaign/content/term` from the URL, the landing **path**, and the referrer **origin**. Keep them in `sessionStorage`. This is functional and cookie-free; whether storage needs consent is a jurisdiction question (NEEDS CONFIRMATION).
2. Send them as hidden fields with the inquiry.
3. The server sanitises them (length caps, allow-listed keys) and writes the `mm_first_*` contact fields **only if empty** (first touch). The opportunity's `mm_opp_lead_source_detail` stores the in-page path (inquiry form, Ask Moguls, division page, service link).
4. Click IDs (gclid, fbclid) are **not collected** until ad platforms are approved.
