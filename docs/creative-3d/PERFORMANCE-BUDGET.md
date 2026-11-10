# Performance budget (3D and motion)

## Current measurements (VERIFIED in this environment, November 2026)

**JavaScript** (gzip -9 of `dist/_astro`):

| Chunk | Size | Loads |
|---|---|---|
| `sculpture` (three.js + scene) | ~135 KB | Lazy, after first paint, hardware GPUs only |
| React client runtime | ~66 KB | With the islands |
| GSAP + ScrollTrigger | ~44 KB | Philosophy and Method sections |
| Ask Moguls island | ~3 KB | Idle |

**Images:**
- First load per page is 11–33 KB (header emblem + hero still).
- Below-the-fold renders are lazy; `pnpm qa` enforces this.
- All 34 renders together are about 408 KB.

**Lighthouse 12.6.1** (local preview, headless Chromium, no GPU):

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home, mobile | 98 | 100 | 100 | 100 | 2.1 s | 0 | 20 ms |
| Home, desktop | 100 | 100 | 100 | 100 | 0.5 s | 0 | 0 ms |

Caveat: with no GPU the live 3D is skipped by design, so **real-GPU frame cost has not been measured**. That needs a device test.

## Budgets for any new 3D or motion work

| Metric | Budget |
|---|---|
| Initial JS before interaction (excluding lazy 3D) | ≤ 120 KB gz |
| Lazy 3D chunk (three.js + scene + material helpers) | ≤ 200 KB gz (+65 KB headroom) |
| Environment map (HDRI) | ≤ 250 KB, compressed, lazy with the sculpture |
| Any glTF asset | ≤ 400 KB after meshopt/KTX2, lazy, desktop-first |
| WebGL contexts per page | **1** |
| Transmission render passes | ≤ 1 per frame (one transmissive mesh) |
| Device pixel ratio cap | 2 desktop / 1.5 mobile (current) |
| Frame time (hero, mid-range laptop GPU) | ≤ 8 ms |
| Frame time (hero, mid-range phone) | ≤ 16 ms; otherwise show the still |
| LCP (mobile, 4G) | ≤ 2.5 s |
| CLS | ≤ 0.05 |
| TBT | ≤ 200 ms |
| First-load images per page | ≤ 400 KB (QA-enforced; raised from 250 KB so phones show every division artwork without tapping) |
| Off-screen behaviour | Render loop paused (current: IntersectionObserver + `visibilitychange`) |

## Guards already in place (keep them)

- Live 3D is skipped for software renderers (`Hero.astro`).
- Reduced motion renders a single static frame.
- A pre-rendered still serves as the fallback image.
- The canvas fades in after boot, so it causes no layout shift.

## Measurement plan for prototypes

1. Run `pnpm qa`, then Lighthouse mobile and desktop on preview.
2. Record a Chrome performance trace on a real GPU: average and p95 frame time over 10 s.
3. Run the same trace with 4× CPU throttling.
4. Test on one real mid-range Android and one iPhone before approval.
