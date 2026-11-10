# Licensing register

Rule: nothing enters the repository until its row is complete, with the source URL, licence, obligations and the date checked. "Publicly downloadable" is not a licence.

## In use today (VERIFIED from `node_modules/*/package.json` or ownership)

| Item | Where | Licence | Commercial | Obligations |
|---|---|---|---|---|
| Astro, @astrojs/react, @astrojs/sitemap | framework | MIT | Yes | Keep licence notices |
| React, React DOM | islands | MIT | Yes | Keep licence notices |
| three.js 0.187 | hero sculpture | MIT | Yes | Keep licence notices |
| GSAP 3.15 (+ ScrollTrigger) | scroll animation | GSAP Standard "no charge" licence (https://gsap.com/standard-license) | Yes | Can't be used inside a no-code visual animation builder that competes with Webflow (not applicable here) |
| Instrument Serif (@fontsource) | display type | OFL-1.1 | Yes | Fonts can't be sold on their own |
| Outfit (@fontsource-variable) | sans type | OFL-1.1 | Yes | Same |
| sharp (dev) | asset build | Apache-2.0 | Yes | Notice |
| @axe-core/playwright (dev) | QA | MPL-2.0 | Yes | Not shipped |
| TypeScript (dev) | type check | Apache-2.0 | Yes | Not shipped |
| Golden crowned M emblem | `brand-source/`, `public/brand/` | **Owner-supplied** | NEEDS CONFIRMATION: the owner should confirm they hold the rights, since the artwork appears AI- or 3D-generated | Keep the master unchanged |
| Sculpture renders `public/renders/*` | site imagery | Owned (rendered from our own code) | Yes | None |

## Candidates (not adopted)

| Candidate | Source | Licence | Commercial | Obligations / risk | Status |
|---|---|---|---|---|---|
| Poly Haven HDRIs | https://polyhaven.com/license | CC0 | Yes | None required; mentioning Poly Haven is requested. Can't be re-licensed | VERIFIED licence; record the specific asset URL on adoption |
| @pmndrs/vanilla (MeshTransmissionMaterial) | https://github.com/pmndrs/drei-vanilla | MIT (as listed) | Yes | Notice | NEEDS CONFIRMATION in the repo LICENSE |
| Astro view transitions | https://docs.astro.build/en/guides/view-transitions/ | MIT (part of Astro) | Yes | None extra | VERIFIED (core dependency) |
| GSAP SplitText | https://gsap.com/standard-license | GSAP Standard "no charge" | Yes | Same as GSAP | VERIFIED |
| React Bits components | https://github.com/DavidHDev/react-bits | MIT + Commons Clause (per README) | Use: yes. Selling the components themselves: no | Plan is to write our own code instead | NEEDS CONFIRMATION (`LICENSE.md`) |
| React Bits Pro | https://pro.reactbits.dev/license | Paid, per-developer seat | Paid | **Purchase needed: not approved** | Excluded |
| Codrops demos | https://tympanus.net/codrops/?p=7319 | MIT unless stated | Yes | No redistribution or resale of the demo; bundled fonts and images keep their own licences | VERIFIED general policy; check each repo |
| Spline community files | https://docs.spline.design/doc/community-platform/docSaqY7mlFz | CC0 1.0 (scene files) | Yes | The runtime licence is not verified | Authoring only |
| Spline runtime | https://www.npmjs.com/package/@splinetool/runtime | NEEDS CONFIRMATION | Unknown | ~548 KB gz | Excluded |
| Sketchfab models | https://help.sketchfab.com/en/articles/16152217 | Per model: CC0 / CC BY / CC BY-NC / CC BY-ND / Standard (paid) | Depends | Attribution for CC BY; NC isn't commercial; ND forbids edits | Avoid by default |
| BlenderKit | https://www.blenderkit.com/docs/licenses/ | Royalty-Free or CC0 | Yes | RF assets can't be resold as 3D models; downloads only through the add-on | Offline renders only |
| Lenis | https://github.com/darkroomengineering/lenis | NEEDS CONFIRMATION | n/a | Rejected (takes over scrolling) | Excluded |
| pmndrs/postprocessing | https://github.com/pmndrs/postprocessing | NEEDS CONFIRMATION | n/a | GPU cost | Excluded |

## Adoption checklist

1. Open the asset's own page and screenshot or save the licence text, with the date.
2. Record the URL, author, licence, version and file hash in this table.
3. Add an attribution to `/legal` if the licence requires one.
4. Put the asset under `public/` (or source it through npm), never hot-linked.
