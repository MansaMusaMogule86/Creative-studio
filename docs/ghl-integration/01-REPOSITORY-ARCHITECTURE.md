# 01 · Repository architecture

All facts are **VERIFIED** from source, `package.json` and `node_modules` at commit `b3060af`, unless marked otherwise.

## Stack
| Item | Value | Evidence |
|---|---|---|
| Framework | **Astro 7.4.7**, static output (no `output` or `adapter` set, so it defaults to static) | `astro.config.mjs:1-24`, `node_modules/astro/package.json` |
| UI islands | React 19.3.1 via `@astrojs/react` (`AskMoguls`, `InquiryForm`) | `src/pages/index.astro`, `src/components/Contact.astro:21` |
| 3D and motion | three 0.187.0 (lazy), GSAP 3.15.1 + ScrollTrigger | `src/scripts/sculpture.ts`, `src/components/Philosophy.astro`, `src/components/Method.astro` |
| Language | TypeScript (strict). `pnpm lint` = `pnpm check` = `tsc -p tsconfig.check.json` (`.ts` and `.tsx` only) | `package.json` scripts, `tsconfig.check.json` |
| Package manager | **pnpm** (`pnpm-lock.yaml`) | repo root |
| Integrations | `@astrojs/sitemap`, production builds only; lists canonical pages only (excludes `/brand`, `/legal/*`, `/404`). `SITE_ENV`≠production → noindex everywhere, robots `Disallow: /`, no sitemap | `astro.config.mjs:18`, `src/config/site.ts`, `src/pages/robots.txt.ts` |
| i18n | `en` (published), `fr`/`ar`/`zh` configured, no routes; RTL helper | `astro.config.mjs:13-19`, `src/i18n/index.ts` |
| Server routes | `src/pages/robots.txt.ts` (static at build). `src/pages/render/[list].json.ts` and `render/[id].astro` are **dev-only** (emitted only with `RENDER_STILLS=1`) | files listed |
| Environment | `SITE_URL` (build-time), `PUBLIC_INQUIRY_ENDPOINT` (browser-exposed) | `.env.example`, `astro.config.mjs:8`, `src/components/InquiryForm.tsx:13` |
| Deployment config | **None** (no Vercel, Netlify, Cloudflare, Docker or CI). `ci/` doesn't exist in this repo | `ls` of repo root |
| Auth | None | — |
| Analytics, consent, logging, monitoring | None | grep of `src/` (see `02`) |
| Tests | `scripts/qa.mjs`: Playwright + axe browser QA (responsive, a11y, links, form flow, Ask Moguls, reduced motion, overlap, images, no-WebGL, brand). No unit tests. No CI | `scripts/qa.mjs` |

## Map
```
astro.config.mjs        site, integrations (react, sitemap), i18n
src/
  config/brand.ts       brand strings, emblem paths; email '' and social [] (not supplied)
  data/divisions.ts     5 divisions × 52 services (slugs used by the form and CRM mapping)
  data/stills.ts        render definitions (dev tooling)
  i18n/index.ts         locales, dirFor(), dictionary
  layouts/Base.astro    <head>: SEO, OG, JSON-LD Organization, favicons, manifest, font preloads
  components/
    Header.astro        nav + CTA + mobile menu (+ scroll-spy)
    Hero.astro          bento hero; WebGL boot guard; Ask Moguls tile
    Universe.astro      division panels
    Services.astro      52-service explorer with "Inquire" links
    Philosophy, Method, Work, Contact, Footer
    InquiryForm.tsx     the only data-collecting form
    AskMoguls.tsx       local keyword finder (lib/intent.ts)
    Logo.astro          crowned-M lockup
  pages/
    index.astro, universe/[division].astro, brand.astro, legal/{privacy,terms}.astro, 404.astro, robots.txt.ts
    render/*            dev-only render harness
  scripts/              sculpture.ts (WebGL), reveal.ts (reveals, header, magnetic)
  styles/               global.css (tokens incl. gold), islands.css
scripts/                qa.mjs, render-stills.mjs, build-brand-assets.mjs
public/                 renders/, brand/, icons, og.png, site.webmanifest
docs/                   product, creative and integration docs
```

## Build readiness (run during this audit)
- `pnpm lint`: pass.
- `astro build`: pass. 10 pages; one warning about the size of the lazy three.js chunk.
- `pnpm qa`: see `11-LAUNCH-READINESS.md` for the result recorded during this audit.

## Implication for the integration
A server-side endpoint needs either:
- **(a)** an Astro adapter (Node, Vercel, Netlify, Cloudflare) with `export const prerender = false` on `src/pages/api/leads.ts`, keeping every other page prerendered; or
- **(b)** a separate serverless function on the chosen host.

This is **BLOCKED** on the hosting decision (`13-DECISIONS-AND-QUESTIONS.md`, D-01).
