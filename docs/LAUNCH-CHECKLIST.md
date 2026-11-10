# Launch checklist (A–Z)

Saved on 2026-11-08 at the owner's request. **First full check: 2026-11-08** (lint, build, `pnpm qa`, `pnpm qa:mobile`, Lighthouse, `pnpm audit`, search/indexing audit). **Re-checked 2026-11-09 after building the lead backend:** lint (tsc + ESLint) ✅, `pnpm test` 32/32 ✅, build ✅, `pnpm qa` 43/43 ✅, `pnpm qa:mobile` 51/51 ✅, overflow audit 320–768 ✅, `pnpm audit` clean ✅, Lighthouse mobile 96–99 (LCP 2.2–2.4 s) / desktop 100, CLS 0.

Legend: ✅ done and verified · ⚠ partial · ❌ missing, doable once unblocked · ⏳ needs owner, host, domain or legal input · n/a not applicable. Ticked boxes are ✅ or n/a.

Totals: ✅ 141 · ⚠ 41 · ❌ 0 · ⏳ 67 · n/a 11 (of 260). Hosting is decided (Vercel + Supabase, DNS at Hostinger) and the lead backend, tests, headers and linting are built. What remains needs the owner: Vercel environment variables and DNS, Supabase migration, HighLevel token, Search Console, legal copy, contact details, real case studies, analytics choice and real-device testing.

## A. Architecture & Planning
- [ ] Business goals and measurable KPIs — ⏳ Owner to define KPIs (leads/month, qualified rate…).
- [ ] Target audience and user personas — ⏳ Owner input; not invented.
- [ ] Competitor and market research — ⏳ Not done; needs owner scope (paid SEO tools need approval).
- [ ] Website sitemap and information architecture — ⚠ Home + 5 division pages; About/Services/Work/Contact pages proposed in docs/full-site-audit.md.
- [x] Page hierarchy and URL structure — ✅ /, /universe/{division}, /legal/*, descriptive slugs.
- [x] Technology stack and hosting architecture — ✅ Astro static site on Vercel, one Vercel Function (`api/leads.ts`) for inquiries, Supabase for lead storage, domain DNS at Hostinger (`vercel.json`, docs/OPERATIONS.md §1).
- [ ] Content management strategy — ⏳ Content lives in src/data + components; CMS decision needed.
- [ ] Environment separation: local, staging, production — ⚠ SITE_ENV production/staging implemented; Vercel Preview should set SITE_ENV=staging (⏳ owner in Vercel).
- [x] Scalability, maintenance and technical documentation — ✅ README, CLAUDE.md, docs/OPERATIONS.md, docs/ghl-integration, docs/creative-3d, CHANGELOG.md.
- [ ] Acceptance criteria and project scope — ⚠ Per-phase criteria in docs (12-IMPLEMENTATION-PLAN, 3D plan); overall scope sign-off ⏳ owner.

## B. Branding & UI Design
- [x] Brand identity, logo and visual guidelines — ✅ Official crowned M; /brand sheet; brand-source master unchanged.
- [x] Color system and contrast ratios — ✅ Tokens in global.css; axe AA + Lighthouse a11y 100.
- [x] Typography and responsive type scale — ✅ Instrument Serif + Outfit, clamp() type scale, fonts preloaded.
- [x] Design tokens and reusable components — ✅ global.css tokens; Logo, DivisionArt, islands.
- [x] Consistent headers, footers and navigation — ✅ Shared Header/Footer on every page (qa brand check).
- [x] Buttons, forms and interaction states — ✅ btn/btn--gold/ghost, form error/success states, focus rings.
- [x] Desktop, tablet and mobile layouts — ✅ qa 320–1440 + qa:mobile 360/390/430/768.
- [x] Dark/light mode where appropriate — n/a Light-only by brand rule (CLAUDE.md).
- [ ] Professional imagery, icons and illustrations — ⚠ Own renders + emblem; no real photography/case imagery yet.
- [ ] Visual quality and brand consistency review — ⚠ Screenshots reviewed by owner; final sign-off ⏳.

## C. Content & Copywriting
- [x] Unique content for each important page — ✅ Unique copy per division; unique titles/descriptions (qa).
- [x] Clear value proposition and headlines — ✅ Hero headline + kicker + lede.
- [x] Service and product descriptions — ✅ 52 one-line service descriptions.
- [x] Conversion-focused calls to action — ✅ ~120 CTAs all reach the inquiry form with pre-fill.
- [ ] Proof, testimonials and verified case studies — ⏳ None by rule (no invented proof); real case studies needed.
- [ ] FAQ content addressing real questions — ⏳ Needs owner answers; not invented.
- [ ] Grammar, readability and localization — ⚠ English reviewed; fr/ar/zh translations ⏳.
- [x] Image captions and descriptive alternative text — ✅ Decorative images alt=""; emblem alt when standalone; qa: no missing alt.
- [ ] Content ownership and editorial workflow — ⏳ Assign owner (docs/OPERATIONS.md §7).
- [ ] Content freshness and review schedule — ⚠ Quarterly review scheduled in docs/OPERATIONS.md §6.

## D. Domain, DNS & Delivery
- [ ] Domain ownership and renewal controls — ⏳ No domain yet (D-02).
- [ ] DNS records verified — ⏳ Needs domain.
- [ ] HTTPS certificates and automatic renewal — ⏳ Needs host.
- [ ] Canonical www or non-www redirects — ⏳ Needs host/domain.
- [ ] DNSSEC where supported — ⏳ Needs registrar.
- [ ] CDN configuration — ⏳ Needs host.
- [ ] Correct HTTP redirects and status codes — ⚠ No redirects needed yet; real 404 verified (qa).
- [ ] Staging and production domain isolation — ⚠ Staging builds are noindex/Disallow; separate hostnames ⏳.
- [ ] Domain email authentication: SPF, DKIM, DMARC — ⏳ Needs domain + mail provider.
- [ ] Domain and DNS recovery procedures — ⏳ Needs registrar access.

## E. Experience & Accessibility
- [x] Keyboard navigation — ✅ Skip link, focusable controls, Escape closes menu/chat, focus return (qa:mobile).
- [x] Visible focus indicators — ✅ :focus-visible outline token.
- [x] Semantic HTML and landmark structure — ✅ header/nav/main/footer on all pages (audit).
- [x] Proper heading hierarchy — ✅ One h1 per page, no level skips (audit + qa).
- [x] Accessible labels and error messages — ✅ Labelled fields, linked error summary, aria-invalid.
- [ ] Screen reader compatibility — ⚠ Semantics + dialog titles in place; manual VoiceOver/TalkBack pass ⏳.
- [x] Touch target sizing — ✅ 44px targets fixed in 49f3595 (audit).
- [x] Reduced-motion support — ✅ qa reduced-motion check; static sculpture frame.
- [x] Color contrast and zoom testing — ✅ axe AA; 320px reflow without overflow; pinch zoom enabled.
- [ ] WCAG 2.2 AA assessment — ⚠ Automated 2.1 AA passes; full manual 2.2 audit ⏳.

## F. Forms & Functional QA
- [ ] All forms submit successfully — ⚠ Built: form → `/api/leads` → Supabase (+ HighLevel). Browser-tested against a mocked backend (qa); live once SUPABASE_* keys are set in Vercel (⏳ owner).
- [x] Server-side validation — ✅ Shared schema (`src/lib/leads/schema.ts`): strict keys, normalisation, known service slugs, length caps; 32 unit tests.
- [x] Required field and format checks — ✅ Client-side checks (InquiryForm.tsx:17-25).
- [x] Spam and abuse prevention — ✅ Honeypot, ≥3 s fill time, stale-timestamp rejection, silent 202 for bots (tests). Turnstile optional (⏳ approval).
- [x] Rate limiting — ✅ Per-IP (salted hash) limit: in-memory window + durable Supabase count; 429 with a clear message (tests + qa).
- [x] Success and error feedback — ✅ Success/error/validation states (qa).
- [x] Duplicate submission protection — ✅ Browser UUID `submissionId` + unique column → 202 duplicate; button disabled while sending (tests).
- [ ] Email and CRM delivery verification — ⏳ Code ready (HighLevel upsert + opportunity + note, retries); needs PIT token and a sandbox check of field names (docs/ghl-integration/08).
- [x] Broken link and button testing — ✅ qa: all internal links resolve.
- [ ] End-to-end critical user journey tests — ⚠ qa covers form → mocked API (success, 422 inline, 429); a real submission needs the deployed site with keys.

## G. Google Search & Indexing
- [ ] Google Search Console setup — ⏳ Needs domain + owner Google account.
- [ ] Domain property verification — ⏳ Needs DNS access.
- [ ] XML sitemap generation and submission — ⚠ Generated (canonical pages only); submission ⏳ Search Console.
- [x] robots.txt validation — ✅ Production allows crawling + sitemap; staging Disallow (qa).
- [x] Indexable pages return HTTP 200 — ✅ qa search block.
- [x] No accidental noindex or X-Robots-Tag blocks — ✅ qa: indexable pages have no noindex; sitemap matches.
- [ ] Correct canonical tags — ⚠ Correct per page (qa); domain ⏳ (SITE_URL).
- [x] Internal links to important pages — ✅ Nav, footer, hero pills, services explorer, 404 recovery.
- [ ] Index coverage and crawl issue monitoring — ⏳ Needs Search Console.
- [ ] URL Inspection for priority pages — ⏳ Needs Search Console.

## H. Hosting & Infrastructure
- [ ] Hosting platform selection — ⏳ D-01.
- [ ] Production environment configuration — ⏳ Needs host.
- [ ] Staging or preview deployments — ⚠ Vercel previews per push; set SITE_ENV=staging for the Preview environment (⏳ owner).
- [ ] Secrets and environment variable management — ⚠ All keys server-only (no PUBLIC_), documented in `.env.example`; to be set in Vercel (⏳ owner).
- [x] Build and deployment reliability — ✅ `vercel.json`: frozen-lockfile install, `pnpm build`, `dist` output.
- [x] Caching and compression — ✅ `vercel.json`: immutable `/_astro/*`, 30-day art/brand, no-store API; Vercel compresses by default.
- [ ] Regional availability and latency — ⏳ Host/CDN choice.
- [ ] Resource limits and scaling — ⏳ Host choice.
- [ ] Uptime and incident monitoring — ⏳ Needs host + tool.
- [ ] Infrastructure documentation — ⚠ docs/OPERATIONS.md; host specifics ⏳.

## I. Images, Media & Assets
- [x] Modern image formats where suitable — ✅ WebP renders/emblem.
- [x] Responsive image sizes and srcset — ✅ srcset/sizes on renders and emblem.
- [x] Lazy loading below-the-fold media — ✅ qa: below-fold renders not loaded eagerly.
- [x] Hero image loading priority — ✅ fetchpriority=high on hero/division stills.
- [x] Image compression and dimension attributes — ✅ All imgs have width/height; homepage first-load images 205 KB desktop / 363 KB mobile (qa budget 400 KB; phones show all five division artworks).
- [x] Optimized fonts and font loading — ✅ Self-hosted, preloaded, CLS 0.
- [x] Video compression and poster images — n/a No video.
- [x] 3D fallback images — ✅ Division art is now the owner's static images (no WebGL needed); the hero sculpture keeps its rendered still fallback (qa).
- [x] Asset licensing and attribution register — ✅ docs/creative-3d/LICENSING-REGISTER.md (emblem rights ⏳ owner).
- [x] Media accessibility and mobile performance — ✅ Decorative alt; mobile art direction verified (qa).

## J. JavaScript & Frontend Quality
- [x] TypeScript or equivalent type checks — ✅ pnpm lint (strict tsc) passes.
- [x] Linting and code formatting — ✅ `pnpm lint` = strict tsc + ESLint (JS, TypeScript, Astro rules), clean.
- [x] Avoid unnecessary client-side JavaScript — ✅ Static pages; islands only for chat/form; 3D lazy.
- [x] Code splitting and lazy loading — ✅ three.js loads lazily for the hero sculpture only; division images lazy (collapsed mobile panels fetch on first open); client:visible/idle islands.
- [x] Error boundaries where relevant — ✅ IslandBoundary on InquiryForm and AskMoguls.
- [x] No browser console errors — ✅ qa checks every page at 6 widths.
- [x] Hydration and rendering correctness — ✅ Islands hydrate; qa flows pass.
- [ ] Cross-browser testing — ⚠ Chromium only in this environment; Safari/Firefox ⏳ real devices.
- [ ] Memory leak and event cleanup checks — ⚠ Listeners cleaned in islands; repeat open/close/rotate verified (qa:mobile); long-session GPU profiling on real devices ⏳.
- [x] Dependency version and compatibility review — ✅ pnpm audit: no vulnerabilities; only TypeScript 7 pending (held for astro tooling).

## K. Keywords & Search Intent
- [ ] Primary and secondary keyword research — ⏳ Not done; needs owner approval for research tools.
- [ ] Keyword-to-page mapping — ⏳ After research.
- [ ] Search intent classification — ⏳ After research.
- [x] Unique title tags and meta descriptions — ✅ qa: unique titles and descriptions.
- [x] One descriptive main heading per page — ✅ qa: one h1 per page.
- [x] Descriptive URL slugs — ✅ /universe/{division}.
- [x] Internal linking and anchor text — ✅ Descriptive anchors (Enter Moguls X, Inquire about Y).
- [ ] Topic clusters and supporting content — ⏳ Insights/articles not built.
- [ ] Keyword cannibalization checks — ⏳ After research.
- [ ] Search performance and ranking measurement — ⏳ Needs Search Console.

## L. Local SEO
- [ ] Google Business Profile where eligible — ⏳ Needs verified address/owner.
- [ ] Accurate business name, address and phone — ⏳ Address/phone not supplied.
- [ ] Relevant service categories — ⏳ GBP setup.
- [ ] Service areas and location landing pages — ⏳ Owner decision.
- [ ] Consistent local citations — ⏳ After NAP.
- [ ] Business hours and contact details — ⏳ Not supplied.
- [ ] Review acquisition and response process — ⏳ Owner process.
- [ ] LocalBusiness structured data where applicable — ⏳ Needs real address (Organization schema present).
- [ ] Local keyword research — ⏳ Owner approval.
- [x] Location page quality and duplication checks — n/a No location pages yet.

## M. Mobile Optimization
- [x] Responsive layouts across screen sizes — ✅ qa + qa:mobile.
- [x] No horizontal overflow — ✅ qa 320–1440.
- [x] Mobile menu and navigation behavior — ✅ Scroll lock, inert background, anchors land below header (qa:mobile).
- [x] Sticky header and safe-area handling — ✅ Header uses the top safe area and tucks on scroll down below 1024 px; chat dialog safe-area aware (qa:mobile).
- [x] Touch-friendly forms and controls — ✅ 44px targets, 16px chat input.
- [x] Readable typography without zoom — ✅ No zoom needed; 16px inputs.
- [x] Mobile image and video optimization — ✅ Wide mobile crops, small files.
- [ ] Real-device performance testing — ⏳ Needs real iPhone/Android.
- [x] Mobile 3D and animation fallback — ✅ Division art is static images; hero sculpture: software-GPU skip, still fallback, reduced motion.
- [x] Portrait and landscape checks — ✅ qa:mobile rotation checks.

## N. Navigation & Internal Links
- [x] Logical primary navigation — ✅ Home/Universe/Services/Work/About/Contact + scroll-spy.
- [x] Clear service and product hierarchy — ✅ Division → services hierarchy.
- [x] Footer navigation — ✅ Divisions, services, legal.
- [x] Breadcrumbs where appropriate — ✅ Visible + BreadcrumbList on division pages.
- [x] Contextual internal linking — ✅ Services ↔ divisions ↔ contact.
- [x] No broken internal or external links — ✅ qa: 131+ internal links; no external links yet.
- [x] No orphaned important pages — ✅ All pages linked from nav/footer (brand sheet intentionally unlinked).
- [x] Descriptive anchor text — ✅ No 'click here'.
- [x] 404 page with recovery paths — ✅ Home, contact + five division links (qa).
- [x] Search or filters for larger websites — n/a Small site; services explorer tabs.

## O. On-Page SEO & Structured Data
- [x] Unique metadata per indexable page — ✅ qa.
- [x] Canonical URL implementation — ✅ Indexable pages only; noindex pages carry none (qa).
- [x] Open Graph and social metadata — ✅ OG image 1200×630 with alt.
- [x] Twitter/X card metadata — ✅ card, title, description, image, alt.
- [x] Organization and WebSite structured data where relevant — ✅ Organization everywhere; WebSite on home.
- [x] BreadcrumbList schema where applicable — ✅ Division pages.
- [x] Product, Article, FAQ or Service markup only when appropriate — ✅ Only Service items in ItemList; no FAQ/Article markup without content.
- [x] JSON-LD validation — ✅ Parses on every page (qa); Google Rich Results test ⏳ after domain.
- [x] Hreflang for multilingual regional alternatives — n/a English only until translations exist.
- [x] No misleading or unsupported rich-result markup — ✅ No reviews/ratings markup.

## P. Performance & Core Web Vitals
- [x] LCP target at or below 2.5 seconds — ✅ Lighthouse mobile 2.2–2.4 s (3 runs), desktop 0.7 s: GSAP lazy-loaded, Universe artwork fetched near view.
- [ ] INP target at or below 200 milliseconds — ⚠ TBT 0–10 ms in lab; real INP needs field data.
- [x] CLS target at or below 0.1 — ✅ CLS 0 (Lighthouse).
- [ ] Real-user field data monitoring — ⏳ Needs analytics/RUM decision (D-07).
- [x] PageSpeed Insights and Lighthouse review — ✅ Lighthouse 95–97 mobile / 100 desktop perf, 100 a11y/BP/SEO (home).
- [x] Bundle size and third-party script budgets — ✅ Budgets in docs/creative-3d/PERFORMANCE-BUDGET.md; no third-party scripts.
- [x] Critical CSS and resource priorities — ✅ Inlined CSS where small, font/emblem preload, hero fetchpriority.
- [ ] Caching and CDN effectiveness — ⏳ Host.
- [ ] Slow-network and low-end-device testing — ⚠ Lighthouse mobile throttling only; real low-end device ⏳.
- [ ] Performance regression testing — ⚠ qa image budgets + LCP re-measured manually; no CI (paused by owner).

## Q. Quality Assurance & Testing
- [x] Unit tests for critical logic — ✅ `pnpm test` (vitest): 32 tests: schema, spam, rate limit, retries, config.
- [x] Integration tests — ✅ Handler tests with mocked Supabase/HighLevel (accept, duplicate, rate limit, CRM down, store down) + browser form test with mocked API.
- [x] End-to-end browser tests — ✅ pnpm qa (38 checks: division artworks visible without tapping at 320–1440, hero deck turns, artwork drifts in 3D, One Team hover, no generated canvases, reduced motion static, owner artwork on all division pages) + qa:mobile (51).
- [ ] Responsive visual regression tests — ⚠ Screenshot review per phase; no pixel-diff baseline.
- [ ] Accessibility automated and manual tests — ⚠ axe automated; manual ⏳.
- [ ] Cross-browser compatibility — ⚠ Chromium only here.
- [x] Broken link scans — ✅ qa.
- [x] Form and payment journey tests — ✅ Form journey tested end to end against a mocked API (qa); no payments (n/a).
- [x] Error state and empty state tests — ✅ Form errors, chat no-match, 404, island fallbacks.
- [x] Release acceptance and regression checklist — ✅ docs/OPERATIONS.md §2 release checklist.

## R. Robots, Crawling & Redirects
- [x] Production robots.txt permits intended crawling — ✅ qa.
- [x] Staging environments blocked from public indexing — ✅ SITE_ENV=staging → noindex + Disallow (verified build).
- [x] XML sitemap contains only canonical indexable URLs — ✅ qa: sitemap = indexable pages.
- [x] 301/308 permanent redirects where appropriate — n/a No moved URLs yet.
- [x] 404 and 410 responses used correctly — ✅ Unknown URL → 404 (qa).
- [x] No redirect chains or loops — ✅ No redirects configured.
- [ ] Canonicalization across URL variants — ⚠ Trailing slashes enforced (`vercel.json`, internal links match canonical); www → apex redirect configured; needs both domains on Vercel (⏳).
- [x] Faceted URL and parameter controls — ✅ Only ?service= pre-fill; canonical ignores it.
- [x] No soft 404 pages — ✅ 404 page served with 404 status.
- [x] Server-rendered content available to crawlers — ✅ Static HTML for all content.

## S. Security & Privacy
- [ ] TLS and HTTPS enforcement — ⏳ Host.
- [x] Security headers including CSP and HSTS — ✅ `vercel.json`: HSTS, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options, CSP Report-Only (enforce after a clean report period).
- [x] Authentication and authorization controls — n/a No accounts on the site.
- [x] Server-side input validation and output encoding — ✅ Strict server parse; JSON responses only; React escapes output.
- [x] CSRF protection where applicable — n/a No server endpoints yet; origin check specified.
- [x] XSS, injection and SSRF defenses — ✅ No user HTML rendered; parameterised PostgREST filters; fixed upstream hosts (no user-controlled URLs); CSP report-only.
- [ ] Secrets management and key rotation — ⚠ No secrets in repo (scan); 90-day PIT rotation scheduled.
- [x] Dependency and supply-chain scanning — ✅ pnpm audit clean; lockfile committed.
- [ ] Access logging, monitoring and incident response — ⏳ Host/monitoring.
- [ ] Privacy policy, retention and consent controls — ⏳ Legal copy D-05.

## T. Technical SEO
- [x] Crawlable HTML and links — ✅ Static HTML anchors.
- [x] Correct HTTP status codes — ✅ 200/404 verified.
- [x] Server-side rendering or static rendering strategy — ✅ Static generation.
- [x] Duplicate content controls — ✅ Unique metadata; noindex drafts.
- [x] Canonical URL consistency — ✅ qa.
- [x] Pagination and faceted navigation strategy — n/a No pagination.
- [x] Structured data consistency with visible content — ✅ Breadcrumb/Service data mirror visible content.
- [x] Mobile-first rendering parity — ✅ Same HTML for all devices.
- [x] International SEO and hreflang where needed — n/a Single language.
- [ ] Technical crawl audit before launch — ⚠ Local audit done; full crawl on production domain ⏳.

## U. UX & Conversion Optimization
- [x] Clear above-the-fold proposition — ✅ Hero headline + CTAs.
- [x] Obvious primary calls to action — ✅ Explore / Start a project / Let's create.
- [x] Minimal-friction lead capture — ✅ Pre-filled services, few required fields.
- [ ] Trust and credibility signals — ⏳ Real case studies/testimonials/contact details needed.
- [x] Readable content hierarchy — ✅ Editorial hierarchy, one h1.
- [x] Accessible interactive feedback — ✅ aria-live log, error summary, status panel.
- [ ] Conversion funnel mapping — ⚠ Mapped in docs/ghl-integration/02 & 10; not measured.
- [ ] Booking and contact journeys — ⚠ Contact journey works to validation; booking ⏳ D-06.
- [ ] A/B test hypotheses — ⏳ After analytics.
- [ ] Behavioral analytics with privacy controls — ⏳ D-07.

## V. Version Control & Deployment
- [ ] Git repository and protected branches — ⚠ Repo + feature branch; branch protection ⏳ owner (GitHub settings).
- [ ] Pull request and code review workflow — ⏳ No PR opened (on request).
- [ ] CI checks for builds and tests — ⏳ Recipe ready; Actions needs approval (billing).
- [x] Dependency lockfiles — ✅ pnpm-lock.yaml.
- [x] Reproducible production builds — ✅ Lockfile + documented env.
- [ ] Preview environments — ⏳ Host.
- [ ] Automated deployment where appropriate — ⏳ Host.
- [x] Rollback strategy — ✅ docs/OPERATIONS.md §3.
- [x] Release notes and change tracking — ✅ CHANGELOG.md.
- [x] Production deployment approval gates — ✅ CLAUDE.md: no deploy without explicit approval; OPERATIONS §2.

## W. Web Analytics & Automation
- [ ] Privacy-compliant analytics setup — ⏳ D-07.
- [ ] Search Console integration — ⏳ Domain.
- [ ] Conversion event tracking — ⚠ Event plan in docs/ghl-integration/10; not implemented.
- [ ] Tag management governance — ⏳ After provider choice.
- [ ] CRM lead capture integration — ⚠ Built (`src/lib/leads/highlevel.ts`), off until HIGHLEVEL_* keys are set; field names need a sandbox check.
- [ ] Workflow and notification automation — ⏳ GHL setup (Prompt 2).
- [x] Attribution and UTM tracking — ✅ First-touch UTM, landing path and referrer origin captured and stored with each lead (qa).
- [ ] Consent-aware tracking behavior — ⏳ Legal + provider.
- [ ] Error and funnel dashboards — ⏳ After analytics.
- [ ] Lead delivery and automation failure alerts — ⏳ Backend + monitoring.

## X. XML, APIs & Integrations
- [x] XML sitemap and feed validation — ✅ Sitemap valid and canonical-only.
- [x] API authentication and authorization — ✅ HighLevel PIT and Supabase service key server-side only; same-origin check on `/api/leads`; table RLS on with no public policies.
- [x] API input/output schema validation — ✅ Strict request schema; typed JSON responses (202/400/403/413/415/422/429/503).
- [x] Rate limits and abuse controls — ✅ See Rate limiting; body capped at 16 KB.
- [x] Webhook signature verification — n/a No webhooks at launch (documented).
- [x] Idempotent webhook and payment handling — ✅ Lead idempotency via `submissionId`; no payments or webhooks yet.
- [x] Timeouts, retries and backoff — ✅ 8 s timeout, 3 retries on 429/5xx with jitter, honours Retry-After (tests).
- [x] Third-party API error handling — ✅ CRM down → lead kept and marked `failed` for replay; store down → 503 retry message; no upstream details leaked.
- [x] Integration contract tests — ✅ Request shape/headers asserted for Supabase REST and HighLevel upsert/opportunity (tests).
- [ ] API versioning and deprecation monitoring — ⚠ Version header + webhook header deprecation tracked in api-requirements.json.

## Y. Year-Round Maintenance
- [x] Regular security patching — ✅ Weekly pnpm audit scheduled (OPERATIONS §6).
- [x] Dependency updates — ✅ Monthly schedule.
- [ ] Automated backups and restore tests — ⏳ Host + CRM.
- [ ] Domain and certificate renewal checks — ⏳ Domain.
- [ ] Uptime and error monitoring — ⏳ Tooling.
- [ ] SEO crawl and indexing reviews — ⚠ Scheduled; needs Search Console.
- [ ] Content freshness reviews — ⚠ Quarterly review scheduled in docs/OPERATIONS.md §6.
- [x] Performance and accessibility regression checks — ✅ qa + qa:mobile + Lighthouse on each release.
- [ ] Periodic access and permission audits — ⚠ Quarterly scheduled; owners ⏳.
- [ ] Incident drills and disaster recovery testing — ⏳ After hosting/monitoring.

## Z. Zero-Defect Launch Gate
- [x] No known critical security vulnerabilities — ✅ pnpm audit clean; secret scan clean.
- [ ] No broken critical user journeys — ⚠ All journeys pass; live delivery starts when keys are set on Vercel.
- [x] No accidental production indexing blocks — ✅ qa: indexable pages/sitemap/robots verified; staging guard.
- [x] No exposed secrets — ✅ Scan clean; only placeholder templates.
- [ ] Verified backups and rollback path — ⚠ Rollback documented; backups ⏳ host.
- [ ] Verified form, CRM and notification delivery — ⏳ Needs Supabase keys (and optional HighLevel token) on Vercel, then one real test submission.
- [x] Core Web Vitals and accessibility reviewed — ✅ Lighthouse + axe (lab).
- [ ] Legal notices and consent reviewed — ⏳ Legal copy needed.
- [ ] Monitoring and ownership assigned — ⏳ Assign in OPERATIONS §7.
- [ ] Documented go/no-go approval and post-launch checks — ⚠ Process documented; sign-off ⏳ owner.
