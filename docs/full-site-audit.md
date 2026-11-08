# Full-site audit: before expanding beyond the homepage prototype

Status: the prototype is **not approved** and has not been deployed. This audit lists what exists, what is missing, and what needs a decision or content from the Mansas Moguls team before it can be built. Nothing here has been implemented yet.

Legend: ✅ in place · ◐ partial or placeholder · ❌ missing · 🔒 needs approval, content or money from the owner

---

## 1. Pages that exist today

| Route | Status | Notes |
|---|---|---|
| `/` | ✅ | Hero (bento), universe, services explorer, philosophy, method, selected work, contact, Ask Moguls |
| `/universe/digital`, `/ai`, `/growth`, `/creative`, `/strategy` | ✅ | Render hero, every service as an anchored section, an inquiry link per service, next-division link, ItemList/Service JSON-LD |
| `/brand` | ✅ (noindex) | Official identity sheet: crowned M lockups (light and dark), icons, colour including gold, type |
| `/legal/privacy`, `/legal/terms` | ◐ 🔒 | Placeholder text, set to noindex. Needs legal copy |
| `/404` | ✅ | |
| `/robots.txt`, `/sitemap-index.xml` | ✅ | `SITE_URL` still defaults to localhost 🔒 |

## 2. Navigation audit

| Item | Goes to | Finding |
|---|---|---|
| Home | `/` | ✅ |
| Universe | `/#universe` | ✅ |
| Services | `/#services` | ◐ No standalone `/services` index page, so it can't be linked or ranked on its own |
| Work | `/#work` | ◐ Placeholders only. No `/work` index or case-study template |
| About | `/#philosophy` | ❌ No About page. The philosophy section is the only "about" content |
| Contact | `/#contact` | ◐ No standalone `/contact` page. Ads and email links will want one |
| Let's create (CTA) | `/#contact` | ✅ |
| Footer: Social | none | 🔒 No profiles were supplied, so nothing is shown rather than inventing handles |
| Language switcher | none | ❌ Locales are configured but no routes or switcher exist |

## 3. Services content audit (52 services)

- ✅ Each service has a title, a one-line benefit description, an anchor on its division page and an inquiry link that pre-fills the form.
- ◐ **No dedicated service pages.** The brief (§14) asks for SEO-ready pages for major services. Each would need its own content: who it's for, what's included, how the process runs, typical timeline, FAQs. That is new copy 🔒, and it should not be generated as filler.
- ❌ No per-service imagery beyond the division render.
- ❓ Priority: which services (for example 8–12) should get full pages first? 🔒

## 4. Content that only the team can supply 🔒

| Content | Where it's needed |
|---|---|
| Production domain | Canonical URLs, Open Graph, sitemap |
| Real case studies (client permission, scope, visuals, outcomes they're willing to publish) | Work section and `/work/[slug]` |
| About: founding story, leadership, team (only verifiable facts) | `/about` |
| Contact details: email, phone, office address in Dubai, hours | Contact page, footer, Organization JSON-LD |
| Social profile URLs | Footer, `sameAs` in JSON-LD |
| Privacy policy and terms (UAE PDPL and GDPR, if applicable) | `/legal/*` |
| French, Arabic and Simplified Chinese translations | Localised routes |
| ~~Identity approval~~ | Done: the golden crowned M is the official emblem |

## 5. Missing functionality

| Capability | Status | Notes |
|---|---|---|
| Inquiry delivery | ◐ 🔒 | The form validates and is ready for an endpoint, but nothing is sent until `PUBLIC_INQUIRY_ENDPOINT` points to an approved CRM or form backend |
| Spam protection | ❌ | Add a honeypot (free) now. A CAPTCHA (Turnstile or hCaptcha) needs approval |
| Consent text at the form | ❌ | A short privacy notice and link, once the privacy policy exists |
| Ask Moguls real AI | ◐ 🔒 | Honest keyword matcher today. A real model needs an approved provider, a server endpoint, rate limits and a cost cap. Keys never go in the frontend |
| Analytics and cookie consent | ❌ 🔒 | Not added. Choose privacy-friendly analytics and add consent if cookies are used |
| Performance monitoring (Core Web Vitals) | ❌ | `web-vitals` reporting can be added once an endpoint exists. Not measured yet |
| Localisation | ◐ | `en/fr/ar/zh` configured, `dirFor()` RTL helper, logical CSS. Missing: routes, switcher, `hreflang`, an Arabic display font, translated content |
| Hosting and deployment | 🔒 | Not chosen and not deployed. GitHub Actions/CI isn't set up |
| Breadcrumb JSON-LD | ❌ | Visual breadcrumbs exist on division pages; structured data doesn't |

## 6. Technical notes

- **JavaScript weight (gzip):**
  - The hero 3D chunk is about 135 KB, lazy-loaded after first paint.
  - GSAP and ScrollTrigger are about 44 KB.
  - The React runtime is about 66 KB.

  A possible later improvement is to replace the React islands with vanilla TypeScript (saving about 70 KB) or trim the three.js imports. Not urgent; first paint doesn't wait on any of it.
- **Images:** 34 WebP renders, 408 KB total, every one referenced. First load is 11–17 KB of images per page, and below-the-fold renders are lazy (enforced by `pnpm qa`).
- **Type checking:** `pnpm lint` and `pnpm check` run strict `tsc` over `.ts` and `.tsx`. `astro check` doesn't yet support this Astro/TypeScript combination, so `.astro` templates are checked only through the build. ESLint isn't configured.
- **Homepage division panels** still use the lightweight animated CSS/SVG artworks, by design: five extra renders there would add weight to the homepage and lose the hover animation. Division pages use the real renders.

## 7. Proposed build order (pending your review)

1. **Structure (no new content needed):** `/services` index, `/work` index plus case-study template (empty-state copy, no fictional projects), `/contact` page, breadcrumb JSON-LD, form honeypot, language-switcher scaffold.
2. **Content pages (needs §4 content):** `/about`, priority service pages, legal pages.
3. **Integrations (needs approval):** inquiry endpoint/CRM, analytics with consent, Ask Moguls backend.
4. **Localisation:** Arabic RTL first if Dubai audiences are the priority, then French and Chinese.
5. **Launch readiness:** domain, hosting, Core Web Vitals measurement on real devices, final accessibility pass.
