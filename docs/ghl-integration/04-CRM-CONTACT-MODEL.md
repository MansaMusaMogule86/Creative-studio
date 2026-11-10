# 04 · CRM contact model (PROPOSED)

Machine-readable: `crm-field-map.json`. Principle: **collect only what sales needs to reply well**. Long-form detail goes in notes, not custom fields.

## Where each data type lives
| Data | Destination | Why |
|---|---|---|
| Identity and reachability (name, email, phone, company, website, country) | **Contact standard fields** | Native search, dedupe, messaging |
| Durable preferences (language, channel), consent records | **Contact custom fields** | Apply across all deals |
| First-touch attribution (UTMs, landing path, referrer origin) | **Contact custom fields, written once** | A first-touch model survives later visits |
| What this enquiry is about (division, services, budget, timeline, qualification, lost reason) | **Opportunity custom fields** | One contact can have several deals |
| Project description, service-specific answers | **Note** on the contact, linked in the opportunity name | Free text; avoids field sprawl |
| Segmentation flags | **Tags** (`mm:` prefix) | Workflow triggers and filters |
| Contracts, files, project plans | **External project records** (PM tool / drive) | Not CRM data |

## Contact fields
| Field | Kind | Required | Validation | Launch |
|---|---|---|---|---|
| First name | standard | ✔ | 1–80 chars | ✔ |
| Last name | standard |  | 0–80 | ✔ |
| Email | standard | ✔ | lower-cased, ≤ 254, syntax check | ✔ |
| Phone | standard | if phone channel | E.164 | ✔ |
| Company | standard |  | ≤ 120 | ✔ |
| Website | standard |  | https URL | v2 |
| Country | standard |  | ISO alpha-2 | v2 |
| City | standard |  | — | ✖ (not collected) |
| Job title | `mm_job_title` |  | ≤ 80 | ✖ (later) |
| Preferred language | `mm_preferred_language` |  | en/ar/fr/zh | v2 |
| Preferred channel | `mm_preferred_channel` | ✔ | email/phone/video | ✔ |
| Marketing consent | `mm_consent_marketing` | ✔ (default false) | boolean | ✔ |
| Consent timestamp | `mm_consent_marketing_at` | when true | ISO time | ✔ |
| Privacy notice version | `mm_privacy_notice_version` | ✔ | text | ✔ |
| UTM source / medium / campaign / content / term | `mm_first_utm_*` |  | ≤ 120 each | ✔ |
| Landing page | `mm_first_landing_page` |  | path only | ✔ |
| Referrer | `mm_first_referrer` |  | origin only | ✔ |
| Lead source | standard `source` | ✔ | "Website — Inquiry form" | ✔ |

The lead source detail, qualification status, budget, timeline and description are **opportunity-level** data (see `05`).

## Service-specific data (phase 2, optional)
Conditional questions per division, stored in the **note**, not as custom fields:
- **Digital:** current site URL; platform type.
- **AI:** process to automate; tools in use.
- **Growth:** channels of interest; monthly marketing budget range.
- **Creative:** deliverables; existing brand guidelines (yes/no).
- **Strategy:** company stage; decision timeline.

## Never collected
Date of birth, address, ID numbers, payment data, IP addresses in CRM records, and Ask Moguls free text.
