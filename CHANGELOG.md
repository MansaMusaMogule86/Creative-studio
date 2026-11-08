# Changelog

All notable changes to the Mansas Moguls website. Newest first. Branch: `claude/affectionate-sagan-nrj1c8`.

## Unreleased
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
