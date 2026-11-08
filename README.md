# Mansas Moguls: The Creative Universe (homepage prototype)

**We architect what's next.** Homepage and division pages in the light, holographic Liquid Pearl direction, carrying the official **golden crowned M** emblem. It is **not deployed**.

- Creative directions and the recommendation: [`docs/creative-directions.md`](docs/creative-directions.md)
- Full-site audit and proposed build order: [`docs/full-site-audit.md`](docs/full-site-audit.md)
- Identity sheet: `/brand` (noindex). Brand assets are generated from `brand-source/crowned-m-master.png` by `pnpm brand:assets`
- Round 2 references: bento hero composition (facts row, pill navigation, division pills over the sculpture card) and spatial floating interfaces (Moguls Digital artwork). Only true facts appear in the hero: Dubai, 5 divisions, 52 services.

## Stack

Astro 7 (static) · TypeScript · React islands (Ask Moguls, inquiry form) · Three.js (hero sculpture only) · GSAP + ScrollTrigger (philosophy and method only) · plain CSS tokens.

Tailwind was left out on purpose: the design runs on roughly 40 tokens in `src/styles/global.css` plus scoped component styles, and adding a utility framework would not have removed any CSS. This can be revisited if the team prefers Tailwind. React Three Fiber was also skipped, because there is a single imperative scene and R3F would add about 150 KB to the bundle for no gain.

## Commands

```bash
pnpm install
pnpm dev                     # http://localhost:4321
pnpm lint                    # strict TypeScript (tsc) over .ts/.tsx (alias: pnpm check)
pnpm build && pnpm preview   # production build
pnpm qa                      # with preview running: responsive, axe, links, flows, reduced motion
pnpm render:stills           # re-render sculpture stills to public/renders (local, free)
pnpm brand:assets            # regenerate emblem, favicons, app icons from the master
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
| Imagery | The hero fallback and the four work frames are **local renders of the real 3D sculpture** (`pnpm render:stills`, config in `src/data/stills.ts`), in division palettes. There's no paid generation. Higgsfield is connected but the account has 0 credits. Hugging Face is not used yet.
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
