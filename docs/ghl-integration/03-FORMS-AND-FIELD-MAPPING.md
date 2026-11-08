# 03 · Forms and field mapping

Detailed field list: `crm-field-map.json`. Inventory: `forms-inventory.json`.

## Architecture decision (PROPOSED)
| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **A. Native GHL embedded form** | No backend; GHL handles storage and triggers | iframe styling breaks the approved design; weaker accessibility control; loses the existing pre-fill, error summary and service picker; third-party script on the page | **Rejected** for the inquiry form |
| **B. Custom form → own server route → HighLevel API** | Keeps the approved, tested UI; server-side validation, spam control and idempotency; full control of consent and mapping; keeps the token secret | Needs hosting with server functions and code to maintain | **Recommended** |

Booking is the exception: a GHL calendar widget or link (see `06`).

## FORM-INQUIRY (v1 existing → v2 proposed)
| Attribute | Specification |
|---|---|
| Form identifier | `FORM-INQUIRY` (send `formId: "inquiry-v2"` in the payload) |
| Page | `/#contact` (pre-fill from `?service=`, Ask Moguls, Inquire links) |
| Purpose | New-business enquiry for any division |
| Fields (v2) | firstName*, lastName, email*, company, website, country, preferredLanguage, services[]*, description*, budget, timeline, preferredChannel* (email/phone/video), phone (required if channel = phone), marketingConsent (unticked checkbox), honeypot (hidden), submissionId (hidden UUID), attribution (hidden: utm_*, landing path, referrer origin, lead_source_detail) |
| Conditional logic | phone is shown and required only for the phone channel (existing, `InquiryForm.tsx:170-174`); timeline is optional |
| Client validation | Existing rules (`InquiryForm.tsx:16-24`) plus name split, URL and country checks |
| Server validation | Same rules re-checked server-side (schema validation); `services` must be known slugs from `src/data/divisions.ts`; lengths capped; strings trimmed and normalised; reject unknown keys |
| Consent language | Privacy notice link under the button (required). A separate, optional, **unticked** marketing opt-in: "Send me occasional updates from Mansas Moguls. You can unsubscribe at any time." **Wording needs legal approval** |
| Contact behaviour | Upsert by email (location duplicate rules). Never overwrite non-empty CRM fields with empty values |
| Opportunity behaviour | Create in `Sales — New Business` / `New Lead`, unless an open opportunity for this contact exists with the same `mm_submission_id` or was created in the last 10 minutes (then add a note) |
| Tags | `mm:web-inquiry`, `mm:division:{division}` (one per selected division), `mm:consent-marketing` only if opted in |
| Workflow trigger | WF-01 (opportunity created at New Lead) |
| Confirmation | Existing success panel ("Thank you, {first name}…") plus an optional "Book a discovery call" link (`PUBLIC_DISCOVERY_BOOKING_URL`) |
| Notification recipients | Via GHL workflow: division owner + sales lead (NEEDS CONFIRMATION) |
| Error handling | Field errors return 422 with field keys, shown inline (existing summary UI). CRM failure: accept and queue (see `08`), so the visitor still sees success. Hard failure returns 503 with a retry message |
| Spam protection | Honeypot + minimum fill time (≥ 3 s) + rate limit per IP (`LEADS_RATE_LIMIT_PER_MINUTE`) + optional Turnstile (needs approval) |
| Analytics | `form_start`, `form_submit_attempt`, `form_validation_error{field}`, `generate_lead` (only on server 2xx). No personal data in events (see `10`) |

## Mapping summary
| Form field | Contact | Opportunity | Note | Tag |
|---|---|---|---|---|
| first / last name | `firstName`, `lastName` | name uses company or full name | — | — |
| email, phone, company, website, country | standard fields | — | — | — |
| preferredChannel, preferredLanguage | `mm_preferred_channel`, `mm_preferred_language` | — | — | — |
| services[] | — | `mm_opp_services`, `mm_opp_division` | listed | `mm:division:*` |
| description | — | — | **note body** | — |
| budget, timeline | — | `mm_opp_budget_range`, `mm_opp_timeline` | listed | — |
| marketingConsent | `mm_consent_marketing`, `mm_consent_marketing_at`, `mm_privacy_notice_version` | — | — | `mm:consent-marketing` |
| attribution | `mm_first_*` (only if empty) | `mm_opp_lead_source_detail` | — | — |
| submissionId | — | `mm_submission_id` | — | — |
