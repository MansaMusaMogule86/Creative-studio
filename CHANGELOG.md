# Changelog

All notable changes to the Mansas Moguls website. Newest first. Branch: `claude/affectionate-sagan-nrj1c8`.

## Unreleased
- **Lead delivery backend** for the inquiry form (Vercel Function `api/leads.ts`, logic in `src/lib/leads/`):
  - **Validation:** one strict schema, shared by the form and the server.
  - **Abuse protection:** same-origin check, 16 KB body cap, honeypot, minimum fill time, and a per-IP rate limit (in memory and durable via Supabase).
  - **No duplicates:** each submission carries a browser-generated `submissionId`.
  - **Storage:** every lead is stored in Supabase (`supabase/migrations/20261109120000_leads.sql`; RLS on, salted IP hash only).
  - **CRM:** optional HighLevel forwarding (contact upsert, opportunity, note) with timeouts and retries. If the CRM is down, the lead is kept and marked for replay.
  - **Attribution:** first-touch UTM, landing path and referrer origin are captured with each lead.
  - **Without keys:** the form still says honestly that nothing was sent.
- **Tests:**
  - `pnpm test` (vitest, 32 tests): schema, spam, rate limit, retries, config, the full handler, and Supabase/HighLevel contract checks.
  - The browser QA adds a form test against a mocked API (payload shape, success, inline 422 errors, 429 message, hidden honeypot).
- **Hosting:** `vercel.json` with build settings, HSTS and security headers, a report-only CSP, cache rules, trailing slashes and a www → apex redirect. Internal links now match the canonical trailing-slash URLs.
- **Linting:** `pnpm lint` now runs strict tsc plus ESLint (JS, TypeScript, Astro); the code is lint-clean.
- **Performance:**
  - GSAP loads only when the Method and Philosophy sections approach.
  - Universe artwork is fetched only near the viewport.
  - Mobile LCP is now 2.2–2.4 s, down from 2.5–3.3 s.
- **Docs:** a go-live runbook (`docs/OPERATIONS.md` §0); `.env.example` lists every variable; the launch checklist has no ❌ items left.

- **Phones and tablets show every division's artwork without tapping.** Each Universe panel now has its artwork card above the title. Tapping the card or the title opens the copy and services. The first-load image budget is raised from 250 KB to 400 KB to allow for this.

- **Only the owner's artwork, and it all moves.** Generated art is removed: the code-built 3D sculptures (showcase), the white-ribbon hero sculpture and the ribbon contact background. The Showcase section and its nav item are gone.
- **New motion layer (`ui/Living.astro` + `scripts/living.ts`):**
  - Your images are never altered.
  - The mouse tilts them in 3D; touch screens get a slow drift.
  - They float, with a moving glass glare and a breathing shadow.
  - One rAF loop runs only for on-screen pieces.
  - Reduced motion keeps everything static.
- **Hero:**
  - A 3D deck of the five division artworks turns every 4.5 s.
  - Pause button; pauses on hover, focus and off-screen.
  - Hovering a division pill brings that division's artwork forward.
- **One Team:** the owner's glass One Team image with a 3D entrance and drift. Four 44 px+ tap targets light each circle and reveal its role.
- **Universe panels and division pages:** the owner's images now tilt, float and glint.
- **Contact:** matches the owner's live design:
  - the official crowned M floats in 3D with a floor reflection;
  - frosted glass step cards with icons, step 3 reading "Move forward together";
  - a glossy violet "Start a project" button.
- **Glass styling:** primary buttons are glossy violet pills, secondary buttons frosted glass; service icon tiles and Method nodes are glass.
- **Performance:** deck cards beyond the first three load only when they come forward.
- **QA:** checks that the deck turns, the artwork drifts, One Team hover and tap work, there are no generated canvases, and reduced motion is static.

- **Showcase replaces the placeholder "Selected work":**
  - The four "Placeholder · concept render" cards, all made from the same white ribbon, are gone.
  - In their place: five live 3D sculptures, each with its own geometry and materials, built in three.js with transmission glass, iridescence and PMREM reflections:
    - Digital: cyan laptop and globe;
    - AI: violet neural bust and chip;
    - Growth: coral columns and arrow;
    - Creative: pink glass M with ribbons;
    - Strategy: champagne crystal king.
  - Division tabs switch the sculpture, with an Explore link for each division.
  - One shared canvas, lazy-loaded near the viewport, paused off-screen and disposed on pagehide; adaptive DPR.
  - Stills of the same scenes are the first paint and the fallback without WebGL; reduced motion gets one still frame.
  - Labelled honestly as studio artworks, not client projects. The nav item is renamed "Showcase" (still `/#work`).
- **Services:**
  - The decorative gradient orbs are removed.
  - Each service has a meaningful Lucide icon in a tile in its division's accent colour.
  - The two underlined links become clear buttons: "Start a project" (keeps `data-inquire` and the form prefill) and "Service details".
  - Tighter mobile rows.
  - Fixed the open-row minus bar, which rendered at 0 px.
- **One Team:**
  - Four distinct materials: iridescent pearl, crystal grid, neural points, rose-gold metal.
  - Each discipline's role is revealed on hover, focus or tap.
- **Dependencies:** added `@lucide/astro` (ISC). `src/astro-modules.d.ts` lets plain `tsc` type-check its `.astro` import.
- **Removed:** the `work-*` ribbon renders and unused square `div3d` stills.
- **"One team" diagram redesigned:** four translucent glass orbs (Creativity, Engineering, Intelligence, Commerce), each with:
  - an iridescent rim that slowly rotates;
  - specular highlights;
  - glass icons;
  - a soft floor reflection.
  - The official crowned M sits in the dark glass core, with ONE TEAM and a gold rule below.
  - Entrance: the orbs converge on scroll, the icons and labels rise in, and the core pops in.
  - Continuous motion: gentle float and rim shimmer, only while on screen, and none with reduced motion.
  - Hover, focus and tap light up one orb and dim the others; on small diagrams the caption below shows the selected line.
  - A container query keeps the labels clear of each other and of the core at every width, checked in `qa:mobile`.
- **Mobile header:** the crowned M, a fine divider and MANSAS MOGULS sit on one fluid line from 320 px up, checked in `qa:mobile`.
- **Division artworks are now the owner's own five images, used exactly as supplied.** This replaces the procedurally generated 3D scenes, which are removed (`division-scenes.ts`, `division-stage.ts`, `stage-manager.ts`, the `div3d-*` stills).
  - The masters are kept byte-for-byte in `brand-source/division-art/`.
  - The site serves WebP copies of the same framing at 480, 768, 1024 and 1536 px.
  - Images are shown whole at 3:2: no crop, overlay, caption pill or motion.
  - Alt text describes each artwork.
  - A collapsed mobile panel fetches its image only when first opened.
- **QA:** checks that each division page shows its owner artwork whole, with no overlay; this replaces the live-3D division checks.

## ab35a4b — Glass 3D division artworks (since replaced) and mobile layout fixes
- **3D division artworks:** the flat division illustrations are replaced by five procedurally modelled glass scenes in three.js. There are no new dependencies.
  - Digital: laptop, dotted globe, UI cards, orbits.
  - AI: glass bust with a neural core, pulsing pathways and an AI chip.
  - Growth: rising glass columns and an ascending arrow.
  - Creative: sculptural glass M (an artwork, not the emblem) with ribbons and swatches.
  - Strategy: crystal king with gold crown, a pawn and an orbit.
- **One shared WebGL renderer per page:**
  - The single canvas moves to the active, visible stage; three.js loads lazily.
  - Scenes are cached (max 2 on phones).
  - The loop pauses off-screen and in hidden tabs.
  - Adaptive pixel ratio, then 30 fps, on slow frames; half-resolution refraction on phones.
  - Full GPU disposal on pagehide, with a rebuild from the back/forward cache.
- **Stills and motion fallbacks:**
  - Every stage first shows a pre-rendered still of the same scene (`div3d-*`, square and wide crops).
  - Software GPUs and no-WebGL get the still with a gentle float.
  - Reduced motion gets one still frame.
- **Hero sculpture:** without a mouse (phones and tablets) it now moves on its own; desktop still follows the pointer.
- **Mobile fixes:**
  - The header tucks away on scroll down (below 1024 px) and returns on scroll up, so it no longer covers headings.
  - The Universe accordion is compact: closed bodies are inert, open/close animates, and the opened panel scrolls clear of the header.
  - Tighter section spacing.
  - The Ask Moguls launcher steps aside when it would cover a control.
  - Ask Moguls is also available from the mobile menu.
- **Scroll lock:** after a rotation it restores to the nearest still-rendered element, so a mobile-only element hidden in landscape no longer sends the page to the top.
- **QA:**
  - live 3D animation and single-canvas checks (`?force-webgl`);
  - lazy panel stills;
  - mobile launcher and rotation checks updated.

## f093b44 — Launch readiness: indexing, metadata, error boundaries, ops docs
- **Launch readiness:**
  - Staging builds (`SITE_ENV≠production`) are noindex, blocked in robots.txt and have no sitemap.
  - The sitemap lists only canonical indexable pages.
  - The build warns when `SITE_URL` is missing.
- **Metadata and structured data:** unique meta descriptions; full Twitter/X card tags; referrer policy; WebSite (home) and BreadcrumbList (division) structured data; no canonical tag on noindex pages.
- **404 page:** now offers recovery links to the five divisions and the contact section.
- **Error boundaries:** added for the inquiry form and Ask Moguls islands.
- **QA:** new search and indexing checks (sitemap versus noindex, unique metadata, canonical, JSON-LD, real 404).
- **Docs:**
  - `docs/OPERATIONS.md` (environments, release, rollback, headers, maintenance);
  - `docs/LAUNCH-CHECKLIST.md` statuses;
  - GHL handoff line references re-verified;
  - API verification labels clarified.

## 6c40065 — Save A–Z launch checklist
## 49f3595 — Fix mobile layouts and chat keyboard behaviour
Viewport-filling chat dialog on phones (keyboard-aware, iOS-safe scroll lock); 44px tap targets; `pnpm qa:mobile`.
## 0360e08 — 3D asset discovery and GoHighLevel integration audit (docs only)
## b3060af — Official golden crowned M identity and restrained gold accents
## d1278f9 — Render-based visual identity, visual QA, full-site audit
## 15927a0 — Local sculpture renders for the hero fallback and work frames
## b74ea05 — Bento hero and spatial interface artwork
## d01c36d — Homepage prototype: Liquid Pearl creative direction
