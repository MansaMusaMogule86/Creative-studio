# 09 · Webhooks and security

## Webhooks
- **Needed at launch: no.** The site only pushes data to GHL. Booking and stage events stay inside GHL workflows.
- **If adopted later** (for example, syncing won deals to a PM tool):
  - **Signature headers:** `X-GHL-Signature` uses **Ed25519** (current), and the legacy `X-WH-Signature` uses RSA-SHA256. The docs say the legacy header is deprecated from **2026-09-01**. *VERIFIED from official guide snippets.*
  - **Still to confirm:** the public key (copy it from the official guide; search copies were inconsistent), the exact signed content (raw body assumed), event names, and whether webhooks are available to a Private Integration or only to marketplace apps. All **NEEDS CONFIRMATION**.
  - **Handler rules:**
    1. Read the raw body.
    2. Verify the signature before parsing; reject with 401 on failure.
    3. Reject replays older than 5 minutes, if a timestamp is provided.
    4. Process idempotently by event ID.
    5. Respond 2xx quickly and do the work asynchronously.

## Security review
| Area | Current (VERIFIED) | Required (PROPOSED) |
|---|---|---|
| HTTPS | Depends on the host (none chosen) | HTTPS only, with HSTS at the host |
| Secrets | None exist. `PUBLIC_INQUIRY_ENDPOINT` is browser-visible by design | PIT in server env only. No `PUBLIC_` prefix. Rotate every 90 days. Store in the host's secret manager |
| Server-side validation | **None** (no server) | Schema validation mirroring the client, plus length caps and known service slugs |
| Spam and bots | None | Honeypot, minimum fill time, per-IP rate limit, optional Turnstile (needs approval), reject disposable domains (optional) |
| Input sanitisation | React escapes output | Trim, normalise, strip control characters; store plain text only; never render CRM data unescaped |
| Rate limiting | None | `LEADS_RATE_LIMIT_PER_MINUTE` per IP plus global; 429 with Retry-After |
| CORS / CSRF | n/a | Same-origin only. Check `Origin` against `LEADS_ALLOWED_ORIGINS`. JSON-only content type. No cookies used, so no CSRF token needed |
| PII minimisation | The form collects only enquiry data | Keep it. No IPs in the CRM. Ask Moguls text is never sent |
| Consent records | None | Store the marketing flag, timestamp and privacy-notice version on the contact |
| Retention and deletion | Not defined | Define a retention period for unqualified leads and a deletion-request procedure (in GHL and backups) — **NEEDS CONFIRMATION** |
| Logging | None | Structured logs without PII. Error tracking with PII scrubbing |
| Access control | n/a | GHL user roles: least privilege; only managers export contacts |
| Opt-out | n/a | Unsubscribe link in any marketing email (GHL native). DND respected |
| Backup and recovery | n/a | GHL export cadence and fallback lead queue retention — **NEEDS CONFIRMATION** |

## Legal (NEEDS CONFIRMATION, not legal advice)
Requirements depend on where the business operates and whom it targets. Candidates to review with counsel:
- the **UAE Federal Decree-Law No. 45 of 2021 (PDPL)**;
- the **DIFC / ADGM** data-protection regimes, if the company is registered in a free zone;
- the **GDPR**, if marketing to EU or UK residents;
- **HighLevel's data-processing terms** (subprocessor and international transfer).

**No compliance is claimed** by this audit.
