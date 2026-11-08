# 02 · Pages and conversion inventory

Machine-readable version: `forms-inventory.json`. Line numbers refer to commit `b3060af`.

## Pages (VERIFIED: `dist/` after build)
| Route | Purpose | Indexable | Conversion points |
|---|---|---|---|
| `/` | Homepage (hero, universe, services, philosophy, method, work, contact) | Yes | FORM-INQUIRY, Ask Moguls, every CTA type |
| `/universe/digital` … `/universe/strategy` (5) | Division pages | Yes | Division start CTA + per-service "Inquire" links |
| `/brand` | Identity sheet | No (noindex, excluded from sitemap) | None |
| `/legal/privacy`, `/legal/terms` | Placeholders | No (noindex) | None |
| `/404` | Not found | No | Link home |

## Existing conversion points (VERIFIED)
| ID | Where | Component / file:line | Current behaviour | Fields | Client validation | Server validation | Destination | Analytics | Works? | Needs GHL | Recommended CRM action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **FORM-INQUIRY** | `/#contact` | `InquiryForm.tsx` (1-185), mounted at `Contact.astro:21` | Accessible form with an error summary; pre-fill from `?service=`, Ask Moguls or "Inquire" links (`InquiryForm.tsx:37-52`) | name, email, company, services[], description, budget, contact method, phone (conditional) | Yes (`InquiryForm.tsx:16-24`) | **None** | `PUBLIC_INQUIRY_ENDPOINT` if set, via browser `fetch` (`:69-75`); **unset → nothing is sent** and the UI says "Prototype mode… nothing was sent" (`:93`) | None | UI yes; **delivery no** | **Yes** | `/api/leads` → upsert contact → opportunity "New Lead" → note → tags |
| **WIDGET-ASK-MOGULS** | `/` floating launcher; hero tile `Hero.astro:53` | `AskMoguls.tsx`, `lib/intent.ts` | Local keyword matching; says it is not AI (`AskMoguls.tsx:73`) | free text (not sent) | n/a | n/a | None; pre-fills services (`:13-16, 97, 103`) | None | Yes | No | PROPOSED: pass `lead_source_detail = ask-moguls` to the form, never the text |

## CTAs (all lead to FORM-INQUIRY; VERIFIED)
| ID | Label | file:line | Target |
|---|---|---|---|
| CTA-HEADER-CREATE | Let's create | `Header.astro:21` | `/#contact` |
| CTA-NAV-CONTACT | Contact | `Header.astro:12` | `/#contact` |
| CTA-MOBILE-CREATE | Let's create (menu) | `Header.astro:36` | `/#contact` |
| CTA-HERO-START | Start a project | `Hero.astro:32` | `#contact` |
| CTA-HERO-ASK | Ask Moguls | `Hero.astro:53` | Opens the widget |
| CTA-SERVICES-INQUIRE ×52 | Inquire about {service} | `Services.astro:37` | `/?service={slug}#contact` |
| CTA-DIVISION-START ×5 | Start a/an {division} project | `universe/[division].astro:31` | `/?service={first}#contact` |
| CTA-DIVISION-SERVICE-INQUIRE ×52 | Inquire | `universe/[division].astro:55` | `/?service={slug}#contact` |
| CTA-FOOTER-START | Start a project | `Footer.astro:13` | `/#contact` |
| CTA-ASK-CONTINUE | Start a project with these | `AskMoguls.tsx:97,103` | Scrolls to the form + pre-fills |

## Requested conversion types: present or absent (VERIFIED by grep of `src/`)
| # | Type | Present? | Note |
|---|---|---|---|
| 1 | Contact | ✅ FORM-INQUIRY | No delivery yet |
| 2 | Consultation request | ◐ | Via FORM-INQUIRY ("Video call" preference); no booking |
| 3 | Quotation request | ◐ | Via the budget field; no dedicated form |
| 4 | Ask about a service | ✅ | Services and division "Inquire" pre-fill |
| 5 | Book an appointment | ❌ | PROPOSED: GHL calendar link after submit |
| 6 | Project brief | ◐ | Description field (≤ 4000 chars) |
| 7 | Proposal request | ❌ | Covered by the inquiry |
| 8 | Subscribe | ❌ | Not recommended at launch |
| 9 | WhatsApp | ❌ | Needs a number and a decision |
| 10 | Email / phone link | ❌ | `brand.email = ''` (`src/config/brand.ts:22`) |
| 11 | Lead magnet | ❌ | — |
| 12 | Partnership | ❌ | — |
| 13 | Support | ❌ | — |
| 14 | Client onboarding | ❌ | PROPOSED: GHL onboarding pipeline + intake form |
