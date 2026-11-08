# 11 · Launch readiness

Checks run during this audit (read-only, local) at commit `b3060af`:
- `pnpm lint` (tsc strict): **pass**.
- `astro build`: **pass**, 10 pages; one chunk-size warning for the lazy three.js bundle.
- `pnpm qa` (Playwright + axe): **25/25 checks passed** (`All QA checks passed`).
- Lighthouse 12.6.1 (preview, earlier in this session, same code): home mobile 98/100/100/100, desktop 100/100/100/100, CLS 0.

## Status table
| Area | Status | Evidence / note |
|---|---|---|
| Production build | ✅ VERIFIED | `astro build` |
| Type checking / lint | ✅ VERIFIED | tsc only. `.astro` templates aren't type-checked (`astro check` doesn't support this Astro/TS combination). No ESLint |
| Responsive layouts | ✅ VERIFIED | qa: 320–1440 px, no overflow |
| Accessibility | ✅ VERIFIED (automated) | axe WCAG 2.1 AA at 390/1440. A manual screen-reader pass is **not done** |
| SEO metadata, canonical, OG, JSON-LD | ✅ in code / ⛔ **blocked by domain** | All derive from `SITE_URL`, which defaults to `http://localhost:4321` (`astro.config.mjs:8`) |
| Sitemap / robots | ✅ generated / ⛔ domain | `robots.txt.ts` points to the sitemap on `SITE_URL` |
| Social sharing image | ✅ VERIFIED | `public/og.png` (crowned M lockup) |
| Broken links | ✅ VERIFIED | qa: 131 internal links resolve |
| Missing pages | ⚠ | About, Services index, Work index, Contact page (see `docs/full-site-audit.md`). Legal pages are placeholders |
| Form behaviour | ⛔ **BLOCKER** | Validates but **doesn't deliver** (no endpoint) |
| Booking flow | ⚠ | None; decision needed (`06`) |
| Environment variables | ⛔ | Only `SITE_URL` and `PUBLIC_INQUIRY_ENDPOINT` exist; the HighLevel variables are proposed (`.env.highlevel.example`) |
| API error handling | ⛔ | No server yet |
| Monitoring / logging | ⛔ | None (uptime, error tracking, log retention) |
| Deployment config | ⛔ **BLOCKER** | No host, adapter or CI |
| Domain and SSL | ⛔ **BLOCKER** | No domain decided |
| Consent and privacy | ⛔ **BLOCKER** | No privacy policy or terms content; no consent text |
| Contact details | ⚠ | No public email, phone or address (`brand.ts:22`). Recommended before launch |
| Emblem rights | ⚠ | Owner to confirm rights to the crowned-M artwork |

## Must fix before launch (blockers)
1. Host and adapter decision, then deployment config.
2. Domain + `SITE_URL` + SSL.
3. Working lead delivery (`/api/leads` → HighLevel) with server validation and spam protection.
4. Privacy policy, terms, consent wording (legal review).
5. Basic monitoring: an uptime check on `/` and `/api/leads` health, plus error alerting.

## Can wait until after launch
Analytics provider, booking embed (if a mailto or phone link is offered meanwhile), About/Services/Work pages, localisation, webhooks, custom booking UI, re-engagement workflow, real-device 3D performance tuning.
