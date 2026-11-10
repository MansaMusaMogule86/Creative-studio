# Premium 3D asset discovery

Scope: 3D assets, effects and components that could raise the Mansas Moguls site without changing its approved design (pearl/lavender/cyan/peach, champagne-gold reflections, glass and iridescence, the liquid-glass hero sculpture and the golden crowned M).

**How this was researched (November 2026):** web searches whose results quote official pages, plus inspection of this repository. Some hosts (for example `marketplace.gohighlevel.com`) are blocked by this environment's network policy, so a few pages could not be opened directly. Every licence below links to its source.

Status labels:
- **VERIFIED**: the licence or fact was confirmed from the official source quoted in the search results.
- **NEEDS CONFIRMATION**: open the linked page and check it before use. This applies to per-asset licences, exact file sizes and preview URLs not seen directly.

Nothing here has been downloaded, installed or bought.

---

## 0. What the site already does (VERIFIED from code)

| Area | Implementation | Files |
|---|---|---|
| Hero sculpture | Custom three.js ribbon along the M path, rebuilt on the CPU each frame. Uses `MeshPhysicalMaterial` (transmission 0.9, iridescence 1, sheen, clearcoat) and a PMREM environment built from coloured light cards, including the new champagne-gold cards and rim light | `src/scripts/sculpture.ts` |
| Hero fallback | Pre-rendered WebP stills; devices with a software renderer skip the live 3D | `src/components/Hero.astro`, `src/data/stills.ts`, `scripts/render-stills.mjs` |
| Division art | Square and wide renders of the same sculpture in five palettes on the division pages; CSS/SVG art on the homepage panels | `src/pages/universe/[division].astro`, `src/components/divisions/DivisionArt.astro` |
| Scroll animation | GSAP 3.15 + ScrollTrigger (philosophy, method); IntersectionObserver reveals | `src/components/Philosophy.astro`, `src/components/Method.astro`, `src/scripts/reveal.ts` |
| Hover and gold effects | CSS-only: gold sheen, `@property` light tracing, magnetic buttons | `src/styles/global.css` |

Most candidates below are therefore *enhancements to an existing pipeline*, not new systems.

---

## 1. Candidates

Columns: source · licence and commercial use · format · performance cost · integration effort · mobile · accessibility · brand fit (1–5).

### A. Environment lighting and materials

| # | Candidate | Source / preview | Technology | Licence (status) | Commercial use | Format | Performance cost | Effort | Mobile | Accessibility | Fit |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A1 | **Poly Haven studio HDRIs** (soft-box studio lighting for glass and gold) | https://polyhaven.com/hdris (category: studio). Licence: https://polyhaven.com/license, FAQ: https://docs.polyhaven.com/en/faq | Equirectangular HDR → `PMREMGenerator` | **CC0** (VERIFIED: "all assets are released under the CC0 license… including commercial work") | Yes. No attribution required (a credit is appreciated); assets can't be re-licensed | `.hdr` / `.exr`, 1K–16K | One-off: about 1–1.5 MB for a 1K `.hdr`; needs conversion to a ≤250 KB compressed form (§PERFORMANCE-BUDGET). No per-frame cost: it replaces the current card environment | Low | Yes (same PMREM; can use a smaller map) | None (decorative) | 5 |
| A2 | **three.js `MeshPhysicalMaterial` transmission and iridescence examples** | https://threejs.org/examples/webgl_loader_gltf_transmission (iridescent glTF sample per three.js PR #22117: https://github.com/mrdoob/three.js/pull/22117) | three.js core | **MIT** (VERIFIED: three is MIT in `node_modules/three/package.json`) | Yes | Code reference; sample glTF models carry their own licences (NEEDS CONFIRMATION per model) | None beyond what's already used | Reference only | Yes | n/a | 4 |
| A3 | **`MeshTransmissionMaterial`** from **@pmndrs/vanilla** (the plain three.js port of Drei) | Docs: https://drei.docs.pmnd.rs/shaders/mesh-transmission-material · package: https://www.jsdelivr.com/package/npm/@pmndrs/vanilla · repo: https://github.com/pmndrs/drei-vanilla | three.js shader on top of `MeshPhysicalMaterial` (chromatic aberration, anisotropic blur, distortion) | **MIT** (listed MIT; NEEDS CONFIRMATION in the repo LICENSE) | Yes | npm ESM | **High:** an extra render pass per transmissive object (Codrops: "Three.js performs a separate render pass of the scene for each object using this material", https://tympanus.net/codrops/?p=89382). Tree-shake to the one material | Medium | Desktop only, or with low samples on mobile | n/a | 5 |
| A4 | **KHR_materials_iridescence** glTF objects authored in Blender | Spec support in gltf-transform: https://gltf-transform.dev/modules/extensions/classes/KHRMaterialsIridescence | glTF 2.0 + GLTFLoader | Tooling MIT; artwork is whatever you author (owned) | Yes, if authored in-house | `.glb` (meshopt/KTX2) | Medium: loader (~30–40 KB gz with meshopt) + asset size | Medium–high (needs 3D authoring) | Yes, with compressed textures | n/a | 4 |

### B. Sculptures and objects

| # | Candidate | Source / preview | Licence (status) | Commercial use | Format | Performance cost | Effort | Fit / notes |
|---|---|---|---|---|---|---|---|---|
| B1 | **Spline community scenes** (glass blobs, iridescent shapes) | https://community.spline.design · licence: https://docs.spline.design/doc/community-platform/docSaqY7mlFz | Scene files **CC0 1.0** (VERIFIED per Spline docs). The **runtime's licence is NOT verified** | Files yes. Runtime NEEDS CONFIRMATION | `.splinecode` + `@splinetool/runtime`, or export to glTF | **Very high** at runtime: about 1.97 MB minified / ~548 KB gzip (DepScope, version unknown; https://depscope.dev/pkg/npm/@splinetool/runtime) | Low to embed, high to make fast | 3. Use only as an **authoring tool → glTF export**, never as a runtime on this site |
| B2 | **Sketchfab downloadable models** (abstract glass and gold forms) | https://sketchfab.com · licences: https://help.sketchfab.com/en/articles/16152217 | **Per model**: CC0, CC BY (attribution required), CC BY-NC (**not commercial**), CC BY-ND (no edits), Standard (paid store) | Depends on model (NEEDS CONFIRMATION each time) | glTF via the download API | Model-dependent; usually needs decimation | Medium | 2. Too generic for this brand, and attribution or NC traps are risky. Avoid unless a specific CC0 piece fits |
| B3 | **BlenderKit models, materials, HDRIs** | https://www.blenderkit.com · licences: https://www.blenderkit.com/docs/licenses/ · FAQ: https://www.blenderkit.com/docs/licenses/licensing-faq/ | **Royalty-Free or CC0** (VERIFIED: "everything downloaded is available for commercial use"; RF assets can't be resold as 3D models) | Yes, inside your own product | Blender add-on only; export glTF yourself | Depends on export | Medium (Blender required) | 3. Useful for gold or glass **materials** in offline renders |
| B4 | **Own sculpture variants** (extend the existing `sculpture.ts` path and palettes) | This repo | Owned | Yes | Code + `pnpm render:stills` | Already within budget | Low | 5. The strongest brand fit, because the shape is already the brand's |

### C. Motion, interaction and transitions

| # | Candidate | Source / preview | Technology | Licence (status) | Performance cost | Effort | Mobile / accessibility | Fit |
|---|---|---|---|---|---|---|---|---|
| C1 | **Astro view transitions** (`<ClientRouter />`, `transition:name` shared elements) | https://docs.astro.build/en/guides/view-transitions/ | Native View Transitions API + Astro router | MIT (Astro) | ~5–10 KB router (NEEDS CONFIRMATION for Astro 7); GPU compositing only | Low | Docs state automatic `prefers-reduced-motion` support and a fallback for unsupported browsers (`animate`, `swap`, `none`). Focus must be managed after navigation | 5 |
| C2 | **GSAP SplitText** (editorial headline reveals) | https://gsap.com/docs/v3/Plugins/SplitText/ · licence: https://gsap.com/standard-license | GSAP plugin (already a dependency) | **GSAP Standard "no charge" licence** (VERIFIED: commercial use including SplitText at no charge; excludes building a no-code visual animation tool that competes with Webflow) | ~6–8 KB gz (NEEDS CONFIRMATION) | Low | Must keep the accessible text (SplitText supports `aria` options; check) and honour reduced motion | 4 |
| C3 | **Pointer-tracked glare / spotlight cards** (gold specular follows the cursor) | Pattern references: React Bits "Spotlight Card" https://github.com/DavidHDev/react-bits | Own CSS custom properties + 1 pointermove handler | React Bits is **MIT + Commons Clause** (per its README; NEEDS CONFIRMATION in `LICENSE.md`). **Recommendation:** write our own ~30 lines; don't copy | ~0 KB; compositor-only | Low | Pointer-only; no effect on touch; disabled with reduced motion | 5 |
| C4 | **CSS scroll-driven animations** (`animation-timeline: view()`) for reveals | MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline | Native CSS | n/a | Moves reveal work off the main thread | Low | Progressive enhancement; keep the IntersectionObserver fallback | 4 |
| C5 | **Codrops demos** (glass refraction text, hover distortion, page transitions) | Hub: https://tympanus.net/codrops/demos · licensing: https://tympanus.net/codrops/?p=7319 · example: https://tympanus.net/codrops/?p=89382 | Mostly three.js / GSAP | **MIT unless stated otherwise** (VERIFIED). No redistribution or resale of the demo itself; bundled fonts and images keep their own licences | Varies (often heavy) | Medium | Varies | 3. Treat as technique references |
| C6 | **Lenis smooth scroll** | https://github.com/darkroomengineering/lenis | JS | MIT (NEEDS CONFIRMATION) | Low | Low | **Rejected:** it takes over native scrolling, which the brief and CLAUDE.md forbid | 0 |
| C7 | **pmndrs/postprocessing bloom** for gold glints | https://github.com/pmndrs/postprocessing | three.js post-processing | Licence NEEDS CONFIRMATION | **High:** full-screen passes every frame | Medium | Poor on mobile | 2. A static highlight in the material gives most of the look for free |

### D. Pipeline and tooling (enablers)

| # | Candidate | Source | Licence (status) | Why |
|---|---|---|---|---|
| D1 | **glTF-Transform** (meshopt, quantisation, KTX2/WebP textures) | https://gltf-transform.dev | MIT (NEEDS CONFIRMATION) | Required before shipping any `.glb` |
| D2 | **Khronos glTF-Compressor** | https://github.com/khronosgroup/gltf-compressor | NEEDS CONFIRMATION | Visual check of texture compression |
| D3 | **three.js `MeshoptDecoder` / `KTX2Loader`** | three.js examples folder | MIT | Decoders for D1 output |

---

## 2. Excluded on principle

- **Any asset whose licence can't be confirmed on its own page**, regardless of whether it's publicly downloadable.
- **CC BY-NC / "personal use" assets.**
- **Stock 3D of crowns, lions or gold "luxury" props.** They would compete with the crowned M and push the site toward the black-and-gold theme the brief rules out.
- **Replacing the hero sculpture.** No candidate gives a compelling reason: it is owned, on-brand, already optimised, and the source of the division and work renders.

See `3D-INTEGRATION-PLAN.md` for the ranked top 10 and the prototype plan, and `LICENSING-REGISTER.md` for obligations.
