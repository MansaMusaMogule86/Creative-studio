# Operations runbook

Hosting: **Vercel** (static Astro site + one Vercel Function, `api/leads.ts`), inquiries stored in **Odoo** (crm.mansasmoguls.com, module `odoo19_form_submissions/`), domain DNS at **Hostinger**. Everything that can be done in the repository is done; steps that need the owner's accounts are marked **⏳ owner**.

## 0. Go-live on Vercel (⏳ owner, about 15 minutes)
1. **Odoo:** install the module from `odoo19_form_submissions/` on crm.mansasmoguls.com, then Website Submissions → Configuration → API Keys → create a key for `mansasmoguls.com` and copy it (shown once). Details: `odoo19_form_submissions/README.md`.
2. **Vercel project:** Add New → Project → import `MansaMusaMogule86/Creative-studio`. Settings → Git → production branch `claude/affectionate-sagan-nrj1c8`. Build settings come from `vercel.json` (pnpm, `dist`).
3. **Environment variables** (Settings → Environment Variables):

   | Name | Production | Preview |
   |---|---|---|
   | `SITE_URL` | `https://mansasmoguls.com` | the preview host |
   | `SITE_ENV` | `production` | `staging` (noindex) |
   | `ODOO_API_KEY` | from step 1 (Sensitive) | leave empty, or a separate key so previews don't write to live Odoo |
   | `HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN`, `HIGHLEVEL_LOCATION_ID`, `HIGHLEVEL_PIPELINE_ID`, `HIGHLEVEL_PIPELINE_STAGE_ID` | optional: CRM forwarding (confirm field names in a HighLevel sandbox first) | leave empty |

   None of these may start with `PUBLIC_`. Redeploy after setting them.
4. **Domain:** Settings → Domains → add `mansasmoguls.com` and `www.mansasmoguls.com`. In **Hostinger → Domains → DNS**, create exactly the records Vercel shows (normally an `A` record for `@` and a `CNAME` for `www` → `cname.vercel-dns.com`) and delete old A/CNAME records pointing at Hostinger hosting. `vercel.json` redirects www → apex.
5. **Verify:** `GET https://mansasmoguls.com/api/leads` answers 405; send one real inquiry from the site and check it appears in Odoo under Website Submissions (Vercel logs show `"odoo":"created"`); run Lighthouse on the live URL; submit the sitemap in Search Console.

If HighLevel forwarding fails, the inquiry is still stored in Odoo and the function logs `stored-highlevel-failed` with the submission ID; enter it in HighLevel manually if needed.

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
