# Changelog

All notable changes to the Mansas Moguls website. Newest first. Branch: `claude/affectionate-sagan-nrj1c8`.

## Unreleased
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
