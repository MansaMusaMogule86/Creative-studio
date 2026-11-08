# 3D integration plan: shortlist and prototype strategy

Status: **PROPOSED**. No production code has been changed. Sources and licences are in `ASSET-DISCOVERY.md` and `LICENSING-REGISTER.md`.

## 1. Ranked shortlist (top 10)

Each criterion is scored 1–5 (5 = best; for cost and complexity, 5 = cheapest or simplest). The total is out of 30.

| Rank | Addition | Visual impact | Brand fit | Performance | Complexity | Cost | Maintainability | Total |
|---|---|---|---|---|---|---|---|---|
| **1** | **CC0 studio HDRI lighting** for the hero sculpture and all renders (A1) | 5 | 5 | 4 | 5 | 5 | 5 | **29** |
| **2** | **Shared-element view transitions**, homepage division panel → division page hero (C1) | 5 | 5 | 5 | 4 | 5 | 4 | **28** |
| **3** | **Pointer-tracked gold glare** on division panels, work cards and bento tiles (C3, own code) | 3 | 5 | 5 | 5 | 5 | 5 | **28** (tie broken by visual impact) |
| 4 | GSAP **SplitText** reveals for section headings (C2) | 4 | 5 | 4 | 4 | 5 | 4 | 26 |
| 5 | **Own sculpture variants**: a tiny live sculpture per division page, reusing `sculpture.ts` with that division's palette (B4) | 5 | 5 | 2 | 3 | 5 | 4 | 24 |
| 6 | **CSS scroll-driven reveals** replacing the IntersectionObserver where supported (C4) | 2 | 4 | 5 | 4 | 5 | 4 | 24 (tie broken by visual impact) |
| 7 | **BlenderKit gold or glass materials**, offline renders only (B3) | 3 | 4 | 5 | 3 | 5 | 3 | 23 |
| 8 | **MeshTransmissionMaterial** chromatic refraction, as an A/B test on desktop only (A3) | 5 | 4 | 2 | 3 | 5 | 3 | 22 |
| 9 | **Iridescent glTF objects** authored in Blender for the Work section, once real case studies exist (A4 + D1) | 4 | 4 | 3 | 2 | 4 | 3 | 20 |
| 10 | **Spline as an authoring tool → glTF export** (never the Spline runtime) (B1) | 3 | 3 | 3 | 3 | 4 | 2 | 18 |

Not recommended: Lenis (it takes over scrolling), post-processing bloom (GPU cost), Sketchfab stock models (licence risk, generic look).

---

## 2. Top three: what, where and why

### #1 CC0 studio HDRI environment (Poly Haven)
- **What:** replace the hand-built coloured light cards in `sculpture.ts` with a real studio HDRI as the PMREM source. Keep a light tint layer, plus the existing lavender, cyan, peach and champagne-gold cards, as additions on top. Real soft-box reflections make glass read as glass and gold highlights read as metal. Today the renders look slightly flat and matte.
- **Where:**
  1. Homepage hero sculpture (live).
  2. Every still in `public/renders/` (hero fallback, five division heroes, four work frames, contact background).
  3. The sharing image (`og.png`).
- **Source:** https://polyhaven.com/hdris (studio category), CC0: https://polyhaven.com/license. The exact HDRI is chosen during the prototype and logged in the register with its page URL.
- **Cost:** one compressed 1K map, about 250 KB or less, loaded with the sculpture chunk after first paint. No change per frame.

### #2 Shared-element page transitions (Astro view transitions)
- **What:** when a visitor opens a division from the homepage universe panel or the hero division pills, the artwork morphs into the division page's hero card and the title slides into place. Going back reverses it.
- **Where:** `Universe.astro` panel art and `Hero.astro` stage pills → `src/pages/universe/[division].astro` `.dv__art` and `h1`. A subtle crossfade on every other route.
- **Source:** https://docs.astro.build/en/guides/view-transitions/ (built into Astro, MIT).
- **Cost:** a small router script; the animation is handled by the browser's compositor. Reduced motion is respected automatically according to Astro's docs. Unsupported browsers fall back to a normal page load.
- **Caveat:** island and script lifecycles (the hero canvas, GSAP ScrollTriggers, Ask Moguls) must be re-initialised and cleaned up on `astro:page-load` / `astro:before-swap`. That is the main engineering risk.

### #3 Pointer-tracked gold glare on premium cards
- **What:** a soft champagne specular highlight follows the cursor across a card, as if it were lit glass, with a 1–2° parallax tilt. It complements the existing one-pass gold light trace.
- **Where:** homepage division panels (`Universe.astro`), Selected Work frames (`Work.astro`), hero bento tiles (`Hero.astro`), and the division render card on division pages.
- **Source:** our own ~30 lines of CSS custom properties and one `pointermove` listener per group. The pattern is inspired by "spotlight card" components such as React Bits (https://github.com/DavidHDev/react-bits, MIT + Commons Clause), but **no code is copied**, so there are no licence obligations.
- **Cost:** effectively zero. It is compositor-only, uses no WebGL and adds no dependency.

---

## 3. Safe, isolated prototype strategy

**Isolation:**
- Prototypes live on a branch `proto/3d-enhancements` (only after approval) **and** behind a dev-only `/lab/*` route.
- The `/lab/*` routes are generated only when `LAB=1`, exactly like the existing `/render/*` harness, so they are never in production builds.
- Production components change only after a prototype is approved.

| Prototype | Files touched (lab only) | Fallback | Reduced motion | GPU guard | Licence gate | Acceptance criteria |
|---|---|---|---|---|---|---|
| P1 HDRI | `src/pages/lab/hdri.astro`, a `palette.env` option in `sculpture.ts` behind a flag | Current card environment; pre-rendered stills unchanged | Static frame, as today | Same single context, DPR cap, software-renderer skip | HDRI page URL + CC0 recorded **before** download | Side-by-side A/B stills approved; HDRI ≤ 250 KB; no frame-time increase over 1 ms on desktop |
| P2 View transitions | `src/pages/lab/vt/*` duplicating the home → division flow | Normal navigation (`fallback: 'swap'` to be decided) | Astro's automatic handling, plus a manual check | None needed | MIT (Astro) | No duplicate ScrollTriggers or WebGL contexts after 10 back-and-forth navigations; focus lands on the `h1`; axe passes; CLS 0 |
| P3 Gold glare | `src/pages/lab/glare.astro` + a scoped `.glare` utility | Static surface (current design) | No tilt and no motion; at most a static highlight | CSS only | Own code | Visible on fine pointers only; no layout shift; 60 fps in a performance trace; contrast unchanged |

Every prototype must also:
- add no new runtime dependency except where noted;
- pass `pnpm lint`, `pnpm build` and `pnpm qa`;
- keep reduced-motion, no-WebGL and 320 px layouts identical in function to today.
