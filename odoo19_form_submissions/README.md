# Website Form Submissions for Odoo 19

The `mansas_form_submissions` module receives contact-form inquiries from the
Mansas Moguls website and stores them in Odoo at `https://crm.mansasmoguls.com/`.
Submissions are kept in their own model, separate from CRM leads. The module
does not depend on `crm`.

```
odoo19_form_submissions/              ← add this folder to Odoo's addons_path
├── mansas_form_submissions/          ← the Odoo module (technical name)
│   ├── __manifest__.py               19.0.1.0.0, LGPL-3, depends: base, mail
│   ├── controllers/main.py           the JSON API
│   ├── lib/payload.py                validation and spam rules (mirrors the website)
│   ├── models/                       submission, service, api key
│   ├── security/                     groups, access rights, multi-company rules
│   ├── data/                         reference sequence, the 52 website services
│   ├── views/                        list, form, search, menus
│   └── tests/                        20 tests (validation and HTTP API)
└── tools/sync_services.mjs           regenerates the service list from src/data/divisions.ts
```

## How it fits together

The website is an Astro site with one Vercel Function, `api/leads.ts`. It is
not Next.js. The inquiry form (`src/components/InquiryForm.tsx`) still posts to
`/api/leads`, so its fields, validation, UI and messages are unchanged. That
server function validates the inquiry, checks it for spam and rate-limits it.
It then sends the inquiry straight to Odoo, server to server:

```
Browser form ──POST /api/leads──▶ Vercel Function ──POST + Bearer key──▶ crm.mansasmoguls.com
               (no secrets)      validate · spam · rate limit           /api/mansas/v1/form-submissions
                                 (Supabase / HighLevel if configured)   validate again · store
```

Why the key is not sent from the browser: anything in browser code is public.
A key there would let anyone post into Odoo. The key stays on the server in an
environment variable, and the browser never sees it. This also means the site's
Content-Security-Policy (`connect-src 'self'`) and its CORS settings need no
change.

## Field mapping

| Website form (payload key) | Odoo field (`mansas.form.submission`) | Rules (same as `src/lib/leads/schema.ts`) |
|---|---|---|
| Name (`name`) | `contact_name` | Required, 2 to 120 characters |
| Business email (`email`) | `email` | Required, valid format, up to 254 characters, stored lower-case |
| Company (`company`) | `company` | Optional, up to 160 characters |
| What are you interested in? (`services[]`) | `service_ids` → `mansas.form.service` (by `slug`) | 1 to 20 slugs |
| Project description (`description`) | `description` | Required, 20 to 4000 characters |
| Budget range (`budget`) | `budget` (selection) | One of the six website labels; empty means "Prefer not to say" |
| Preferred contact method (`contact`) | `preferred_contact` | `email`, `phone` or `video`; defaults to email |
| Phone number (`phone`) | `phone` | Required when contact is `phone` (format `+` and 7 to 20 digits, spaces, `()-`) |
| `submissionId` (UUID) | `submission_id` (unique) | Makes retries idempotent |
| `startedAt` (ms) | `form_started_at`, `fill_duration` | Used by the spam timing check |
| `website` (honeypot) | not stored | If filled in, the submission is treated as spam |
| `attribution.*` | `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `landing_path`, `referrer_origin` | Up to 200 characters each; unknown keys are dropped |
| whole `submission` object | `raw_payload` | Original data, re-indented for reading |
| `meta.source_url` | `source_url`, `source_website` (host) | Falls back to the API key's Website URL |
| `meta.received_at` | `submitted_at` | Falls back to Odoo's receipt time if missing or more than 1 day off |
| `meta.client_ip_hash` | `client_ip_hash` (visible to system admins only) | Salted SHA-256, never a raw IP; used for rate limiting |
| `meta.user_agent` | `user_agent` | Up to 300 characters |

Odoo also records a reference (`WEB/2026/00001`), a status (New, In Progress,
Replied, Closed, Spam), an assignee, the company, the API key used and the
chatter with activities.

If the website ever sends a service slug that Odoo does not know, Odoo creates
it under division "Other" so the inquiry is never lost. You can rename it later
under Configuration → Services. To refresh the list from the website, run
`node odoo19_form_submissions/tools/sync_services.mjs` and then upgrade the
module. The records are `noupdate`, so names you have edited in Odoo are kept.

## Installation

1. Copy or clone `odoo19_form_submissions/` onto the Odoo server. On Odoo.sh,
   commit it to the instance's repository instead.
2. Add the folder to `addons_path`. For example, in `odoo.conf`:
   `addons_path = /opt/odoo/odoo/addons,/opt/odoo/custom/odoo19_form_submissions`
3. Restart Odoo, enable developer mode, open Apps → Update Apps List, search
   for **Website Form Submissions** and click Install. From the command line:
   `odoo -d <db> -i mansas_form_submissions --stop-after-init`
4. Optional: run the tests with
   `odoo -d <test-db> -i mansas_form_submissions --test-tags /mansas_form_submissions --stop-after-init`

Checked on 2026-11-18 against the official `odoo:19` image with PostgreSQL 16.
The module installs and upgrades without warnings, and 20 of 20 tests pass.

## Configuration in Odoo

1. Give people access in Settings → Users → *user* → Form Submissions:
   * **User** can see and process submissions.
   * **Administrator** can also delete submissions and manage services and
     API keys. The admin user and system administrators get this group
     automatically.
2. Go to **Website Submissions → Configuration → API Keys → New**. Enter
   Website `mansasmoguls.com` and Website URL `https://mansasmoguls.com`, then
   Save.
3. Click **Generate Key** and copy the key straight away (`mmfs_…`). Odoo
   stores only a SHA-256 hash and cannot show the key again.
   * **Rotate Key** issues a new key, and the old one stops working at once.
   * **Revoke Key** or archiving the record shuts the website out.
4. Optional system parameters (Settings → Technical → System Parameters):

| Key | Default | Meaning |
|---|---|---|
| `mansas_form_submissions.ip_rate_limit_per_minute` | `5` | Submissions per visitor IP hash per minute (`0` turns it off) |
| `mansas_form_submissions.min_fill_ms` | `3000` | Minimum time between opening and sending the form |

The per-key limit is set on each API key record (default 60 per minute).

The API routes use `auth='public'`, so Odoo must know which database to use
for `crm.mansasmoguls.com`. That is automatic when the server has a single
database or a `dbfilter` (Odoo.sh is always set up this way). Otherwise set
`ODOO_DATABASE` on the website, which sends the `X-Odoo-Database` header.

## Website environment variables

Set these in Vercel → Project → Settings → Environment Variables. They are
server-only, so never prefix them with `PUBLIC_`. `.env.example` lists them.

| Variable | Required | Value |
|---|---|---|
| `ODOO_API_KEY` | yes (turns the integration on) | The key from step 3. Treat it as a secret. |
| `ODOO_BASE_URL` | no | Default `https://crm.mansasmoguls.com`. Must be HTTPS (plain `http://localhost` is allowed for testing). |
| `ODOO_DATABASE` | no | Only for multi-database servers without a dbfilter |
| `SITE_URL` | recommended | `https://mansasmoguls.com`, sent as the source website |
| `LEADS_IP_SALT` | recommended | A random secret used to hash visitor IPs |

Odoo can run alone or alongside Supabase and HighLevel. The website returns
success to the visitor once at least one durable store (Supabase or Odoo) has
the inquiry. If Odoo is the only store and it is down or rejects the key, the
visitor sees the existing "Something went wrong" message and can try again.
Nothing is lost silently. Redeploy after changing variables.

## API reference

### `POST /api/mansas/v1/form-submissions`

```http
POST /api/mansas/v1/form-submissions HTTP/1.1
Host: crm.mansasmoguls.com
Authorization: Bearer mmfs_<prefix>_<secret>
Content-Type: application/json

{
  "submission": {
    "name": "Amina Rahman", "email": "amina@example.com", "company": "Example Co",
    "services": ["premium-websites", "ai-agents"],
    "description": "We need a new website and an AI assistant for our sales team.",
    "budget": "USD 25k–75k", "contact": "email", "phone": "",
    "submissionId": "3f2b8a4e-1c2d-4e5f-9a8b-7c6d5e4f3a2b",
    "startedAt": 1763460000000, "website": "",
    "attribution": { "utm_source": "linkedin", "landing_path": "/" }
  },
  "meta": {
    "source_url": "https://mansasmoguls.com",
    "client_ip_hash": "<64 hex>", "user_agent": "Mozilla/5.0 …",
    "received_at": "2026-11-18T10:00:00.000Z"
  }
}
```

`submission` must be exactly what the browser sends to `/api/leads`. Unknown
keys are rejected. `meta` and each of its keys are optional.

| Status | Body | Meaning |
|---|---|---|
| 201 | `{"ok":true,"id":17,"reference":"WEB/2026/00017"}` | Stored |
| 200 | `{"ok":true,"duplicate":true,"reference":"…"}` | Already received (safe retry) |
| 202 | `{"ok":true}` | Judged as spam (honeypot or fill time). Not stored, and bots get no hint. |
| 400 | `{"ok":false,"code":"bad_json"}` | Body is not JSON |
| 401 | `{"ok":false,"code":"unauthorized"}` | Missing, wrong, revoked or archived key (`WWW-Authenticate: Bearer`) |
| 405 | | Method other than POST |
| 413 | `{"ok":false,"code":"too_large"}` | Body larger than 16 KB |
| 415 | `{"ok":false,"code":"unsupported_media_type"}` | Not `application/json` |
| 422 | `{"ok":false,"code":"invalid","errors":{"email":"…"}}` | Validation failed. `_form` means the request shape is wrong. |
| 429 | `{"ok":false,"code":"rate_limited"}` | Per-key or per-visitor limit reached (`Retry-After: 60`) |
| 500 | `{"ok":false,"code":"server_error"}` | Unexpected error. Logged, nothing stored. |

### `GET /api/mansas/v1/ping`

Checks a key without creating anything. It returns 200
`{"ok":true,"website":"mansasmoguls.com"}`, or 401.

```bash
curl -s https://crm.mansasmoguls.com/api/mansas/v1/ping -H "Authorization: Bearer $ODOO_API_KEY"
```

## Security notes

* **Authentication:** a 256-bit random bearer key. Odoo stores only its
  SHA-256 hash, finds it by a non-secret prefix and compares in constant time.
  Keys can be rotated and revoked, and they are tied to a company.
* **Transport:** HTTPS only. The website refuses a non-HTTPS `ODOO_BASE_URL`.
  Authentication happens before the body is parsed. Bodies are capped at 16 KB.
* **Validation:** a strict schema with Unicode normalisation, control-character
  stripping and length caps. Validation runs twice: on the website and again
  in Odoo.
* **Spam:** honeypot, minimum and maximum fill time, and per-visitor and
  per-key rate limits.
* **Idempotency:** a unique `submission_id` plus a savepoint guards against
  concurrent retries.
* **Privacy:** no raw IPs, and logs record outcomes only (no names, emails or
  message text). The visitor IP hash is visible to system administrators only.
* **Access:** submission fields are read-only in the backend; only the status
  and assignee are edited. Deleting submissions needs the Administrator group.
  Multi-company record rules apply.

## Converting a submission to a CRM lead later

This was deliberately left out. If it is needed, a small follow-up module
depending on `crm` and this module can add a "Create Lead" button that copies
the fields and links the lead back to the submission.
