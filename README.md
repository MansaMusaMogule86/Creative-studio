# Mansas Moguls: The Creative Universe (homepage prototype)

**We architect what's next.** This is a homepage prototype for the proposed new light, holographic identity. It is **not deployed** and does not replace any approved brand asset.

- Creative directions and the recommendation: [`docs/creative-directions.md`](docs/creative-directions.md)
- Proposed identity sheet: `/brand` (excluded from the sitemap and set to noindex)

## Stack

Astro 7 (static) · TypeScript · React islands (Ask Moguls, inquiry form) · Three.js (hero sculpture only) · GSAP + ScrollTrigger (philosophy and method only) · plain CSS tokens.

Tailwind was left out on purpose: the design runs on roughly 40 tokens in `src/styles/global.css` plus scoped component styles, and adding a utility framework would not have removed any CSS. This can be revisited if the team prefers Tailwind. React Three Fiber was also skipped, because there is a single imperative scene and R3F would add about 150 KB to the bundle for no gain.

## Commands

```bash
pnpm install
pnpm dev                     # http://localhost:4321
pnpm check                   # TypeScript (tsc) over .ts/.tsx
pnpm build && pnpm preview   # production build
pnpm qa                      # with preview running: responsive, axe, links, flows, reduced motion
```

Set `SITE_URL` before a real build; canonical, Open Graph and sitemap URLs come from it. See `.env.example`.

## What's real and what's a placeholder

| Area | Status |
|---|---|
| Hero sculpture, divisions, services explorer, method, philosophy | Working |
| Division pages `/universe/*` (52 services, each with an anchor) | Working, with JSON-LD |
| Ask Moguls | **Keyword matcher, not AI.** The interface says so. `src/lib/intent.ts` can sit behind a server endpoint once a model provider is approved. No API keys in the frontend. |
| Inquiry form | Validates fully. If `PUBLIC_INQUIRY_ENDPOINT` is set, it POSTs JSON there (CRM or webhook). Without it, the form says plainly that **nothing was sent**. |
| Selected work | Clearly labelled editorial placeholders. No clients, results or awards. |
| Contact details, social profiles | Not provided, so nothing is shown (`src/config/brand.ts`). |
| Legal pages | Placeholders, set to noindex, awaiting legal copy. |
| Localization | Locales `en/fr/ar/zh` are configured, the RTL direction helper exists and CSS uses logical properties. Only English is published. |
| Hugging Face | Not used yet. The public page uses local, code-generated visuals. Model or hosting costs have not been evaluated; see `docs/creative-directions.md`. |

## Structure

```
src/config/brand.ts         brand strings (name, tagline, identity status)
src/data/divisions.ts       5 divisions × 52 services, the single source of truth
src/scripts/sculpture.ts    WebGL liquid-glass ribbon (lazy-loaded, paused off-screen)
src/components/…            Hero, Universe, Services, Philosophy, Method, Work, Contact, AskMoguls, InquiryForm
src/pages/                  /, /universe/[division], /brand, /legal/*, robots.txt, 404
scripts/qa.mjs              local browser QA
```
