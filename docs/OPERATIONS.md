# Operations runbook

What can be done in the repository is done. Anything that needs a hosting platform, a domain or an owner decision is marked **⏳ host / owner**. Nothing here is deployed.

## 1. Environments
| Environment | How | Indexing |
|---|---|---|
| Local | `pnpm dev` (or `pnpm build && pnpm preview`) | n/a |
| Staging / preview | Build with `SITE_ENV=staging SITE_URL=https://<staging-host>` | **Blocked:** every page is `noindex`, `robots.txt` is `Disallow: /` and no sitemap is emitted (`src/config/site.ts`, `src/pages/robots.txt.ts`) |
| Production | Build with `SITE_ENV=production` (the default) and `SITE_URL=https://<domain>` | Indexable. The sitemap lists only canonical pages (excludes `/brand`, `/legal/*`, `/404`) |

The build prints a warning when `SITE_URL` is missing, so a localhost-canonical build can't go out unnoticed. Staging and production must use **different hostnames** (⏳ host / owner).

## 2. Release checklist (until CI exists)
1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm build`
4. `pnpm preview &`, then `pnpm qa` and `pnpm qa:mobile` (all must pass)
5. `pnpm audit` (no high or critical vulnerabilities)
6. Update `CHANGELOG.md`
7. Owner go/no-go recorded in the PR (production deploys need explicit approval)
8. After deploy: run the smoke check in §4

**CI:** not configured on purpose, because GitHub Actions minutes are a paid resource and need approval. The commands above are the CI recipe when approved (⏳ owner).

## 3. Rollback
- **Code:** `git revert <commit>` on the release branch, push, redeploy. Never force-push.
- **Hosting:** every mainstream static host keeps previous deployments; promote the last good one (⏳ host).
- **Forms/CRM** (once built): the lead endpoint must fail closed with the visitor-facing error, never silently drop leads (see `docs/ghl-integration/08-API-ARCHITECTURE.md`).

## 4. Post-deploy smoke check
- `/`, the five `/universe/*` pages, `/robots.txt` and `/sitemap-index.xml` return 200; an unknown URL returns 404.
- The canonical and `og:url` use the production domain; no `noindex` on indexable pages.
- The hero loads; the chat opens and closes on a phone; the inquiry form validates.
- Once the CRM is live: one test submission reaches the **test** location only.

## 5. Recommended security headers (⏳ host: configure in the host's headers file)
| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (only after HTTPS is confirmed on all subdomains) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` (also set as a meta tag in `Base.astro`) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `X-Frame-Options` | `DENY` (or CSP `frame-ancestors 'none'`) |
| `Content-Security-Policy` | Start in **Report-Only**: `default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`. Astro inlines a few small scripts (theme class, JSON-LD), so move to hashes before enforcing. Add the CRM booking host to `frame-src` only if a booking iframe is approved |

Caching: hashed assets in `/_astro/*` → `Cache-Control: public, max-age=31536000, immutable`; HTML → `no-cache`; `/renders/*` and `/brand/*` → `max-age=2592000`.

## 6. Year-round maintenance schedule
| Cadence | Task |
|---|---|
| Weekly | `pnpm audit`; check uptime and error alerts (⏳ monitoring) |
| Monthly | `pnpm outdated` and update patch/minor versions with the full QA run; review Search Console coverage (⏳ owner) |
| Quarterly | Rotate the HighLevel Private Integration Token (docs recommend 90 days); access and permission audit; Lighthouse and accessibility regression run; content freshness review; restore test of backups (⏳ host) |
| Yearly | Domain and certificate renewal check (⏳ owner), legal page review, incident drill |

Known dependency note: TypeScript is held at 6.x because `astro check` doesn't support 7.x yet (`pnpm outdated` reports 7.0.2).

## 7. Ownership (⏳ owner to assign)
| Area | Owner |
|---|---|
| Domain and DNS | — |
| Hosting and deploys | — |
| CRM (HighLevel) | — |
| Content | — |
| Security and incidents | — |
