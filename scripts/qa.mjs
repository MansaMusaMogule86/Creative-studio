// Local QA: run against `pnpm preview` (default http://localhost:4321).
//   pnpm build && pnpm preview &   then   pnpm qa
// Checks: console errors, horizontal overflow at 320–1440 px, axe (WCAG 2.1 AA),
// internal links, the inquiry form, Ask Moguls, the division explorer, reduced motion,
// sculpture overlap, image loading/weight/art direction and the no-WebGL fallback.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { AxeBuilder } = await import('@axe-core/playwright');

const BASE = process.env.QA_URL ?? 'http://localhost:4321';
const OUT = 'qa-output';
mkdirSync(OUT, { recursive: true });
const WIDTHS = [320, 375, 390, 768, 1024, 1440];
const PAGES = ['/', '/universe/digital', '/universe/ai', '/universe/growth', '/universe/creative', '/universe/strategy', '/brand', '/legal/privacy', '/legal/terms'];
const failures = [];
const fail = (m) => { failures.push(m); console.log('  ✗', m); };
const ok = (m) => console.log('  ✓', m);

const browser = await chromium.launch();
const scrollThrough = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.6) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 120)); }
    scrollTo({ top: 0, behavior: 'instant' });
  });
  await p.waitForTimeout(1300);
};

// 1. Responsive, console and axe on every page at every width.
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 800 : 900 } });
  for (const path of PAGES) {
    const p = await ctx.newPage();
    const errs = [];
    p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    p.on('pageerror', (e) => errs.push(e.message));
    const res = await p.goto(BASE + path, { waitUntil: 'networkidle' });
    if (res.status() !== 200) fail(`${path} returned ${res.status()}`);
    await scrollThrough(p);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) fail(`${path} @${w}: horizontal overflow ${overflow}px`);
    if (errs.length) fail(`${path} @${w}: console errors: ${errs.join(' | ')}`);
    if (path === '/' && (w === 1440 || w === 390 || w === 320)) {
      await p.screenshot({ path: `${OUT}/home-${w}.png`, fullPage: true, timeout: 120000 });
    }
    if (w === 1440 || w === 390) {
      const axe = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      for (const v of axe.violations) fail(`${path} @${w} axe ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0].target}`);
    }
    await p.close();
  }
  ok(`width ${w}: ${PAGES.length} pages checked`);
  await ctx.close();
}

// 2. Every internal link resolves.
{
  const p = await browser.newPage();
  const hrefs = new Set();
  for (const path of PAGES) {
    await p.goto(BASE + path);
    (await p.$$eval('a[href^="/"], a[href^="#"]', (as) => as.map((a) => a.getAttribute('href')))).forEach((h) => hrefs.add(h.startsWith('#') ? path + h : h));
  }
  for (const h of hrefs) {
    const [pathPart, hash] = h.split('#');
    const r = await p.goto(BASE + (pathPart || '/'));
    if (r.status() !== 200) { fail(`link ${h} → ${r.status()}`); continue; }
    if (hash && !(await p.$(`[id="${hash}"]`))) fail(`link ${h}: no element #${hash}`);
  }
  ok(`${hrefs.size} internal links resolve`);
  await p.close();
}

// 3. Flows on the homepage.
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });

  // Division explorer: hover opens a world, link opens its page.
  await p.hover('[data-panel]:nth-child(3)');
  if (await p.$eval('[data-panel]:nth-child(3) button', (b) => b.getAttribute('aria-expanded')) !== 'true') fail('hover did not open division 3');
  await p.focus('[data-panel]:nth-child(3) .panel__enter');
  await p.keyboard.press('Enter');
  await p.waitForURL('**/universe/growth');
  ok('division panel opens on hover and links to its world');
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });

  // Services tabs.
  await p.click('#tab-ai');
  if (!(await p.isVisible('#list-ai')) || (await p.isVisible('#list-digital'))) fail('service tabs did not switch');
  else ok('services explorer tabs switch');

  // Ask Moguls → prefill inquiry.
  await p.evaluate(() => scrollTo(0, innerHeight));
  await p.click('.ask__launch');
  await p.click('.ask__examples button >> nth=0');
  const firstService = await p.textContent('.msg__services li strong');
  if (!firstService) fail('Ask Moguls returned nothing for an example'); else ok(`Ask Moguls → "${firstService}"`);
  await p.click('.msg__cta');
  await p.waitForFunction(() => document.querySelectorAll('.f-chip input:checked').length > 0, null, { timeout: 8000 }).catch(() => {});
  const checked = await p.$$eval('.f-chip input:checked', (i) => i.length);
  if (checked < 1) fail('Ask Moguls did not prefill the inquiry form'); else ok(`inquiry prefilled with ${checked} service(s)`);

  // Inquiry form validation and confirmation.
  await p.click('.f button[type=submit]');
  if (!(await p.isVisible('.f-summary'))) fail('empty submit showed no error summary');
  const invalid = await p.$$eval('[aria-invalid=true]', (e) => e.length);
  if (invalid < 3) fail(`expected ≥3 invalid fields, got ${invalid}`); else ok('validation errors are announced and linked');
  await p.fill('.f input[autocomplete=name]', 'Test Person');
  await p.fill('.f input[type=email]', 'test@company.example');
  await p.fill('.f textarea', 'We would like to discuss a new platform for our team.');
  await p.click('.f button[type=submit]');
  if (!(await p.isVisible('.f-done'))) fail('valid submit showed no confirmation');
  else ok(`confirmation: "${(await p.textContent('.f-done h3'))}"`);

  // Mobile menu.
  const m = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await m.goto(BASE + '/');
  await m.click('[data-menu-toggle]');
  if (!(await m.isVisible('#mobile-menu'))) fail('mobile menu did not open');
  await m.keyboard.press('Escape');
  if (await m.isVisible('#mobile-menu')) fail('Escape did not close mobile menu'); else ok('mobile menu opens and closes');
  // Tap accordion on mobile.
  await m.click('[data-panel]:nth-child(2) button');
  if (await m.$eval('[data-panel]:nth-child(2) button', (b) => b.getAttribute('aria-expanded')) !== 'true') fail('tap did not open division on mobile'); else ok('mobile division tap control works');
  await m.close();
  await p.close();
}

// 4. Reduced motion: no running animation loop, content visible.
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  const hidden = await p.$$eval('[data-reveal]', (els) => els.filter((e) => getComputedStyle(e).opacity === '0').length);
  if (hidden) fail(`reduced motion: ${hidden} reveal element(s) still hidden`); else ok('reduced motion: all content visible without animation');
  await ctx.close();
}

// 5. Visual integrity: the sculpture never overlaps navigation, headings or buttons.
const GUARDED = {
  '/': { art: ['.tile--stage', '.stage__pills', '.stage__label'], keep: ['.hdr__bar', '#hero-title', '.hero__ctas', '.hero__facts', '.hero__copy'] },
  '/universe/digital': { art: ['.dv__art', '.dv__art figcaption'], keep: ['.hdr__bar', 'h1', '.dv__ctas', '.dv__crumb', '.lede'] },
  '/universe/ai': { art: ['.dv__art', '.dv__art figcaption'], keep: ['.hdr__bar', 'h1', '.dv__ctas', '.lede'] },
  '/universe/growth': { art: ['.dv__art', '.dv__art figcaption'], keep: ['.hdr__bar', 'h1', '.dv__ctas', '.lede'] },
  '/universe/creative': { art: ['.dv__art', '.dv__art figcaption'], keep: ['.hdr__bar', 'h1', '.dv__ctas', '.lede'] },
  '/universe/strategy': { art: ['.dv__art', '.dv__art figcaption'], keep: ['.hdr__bar', 'h1', '.dv__ctas', '.lede'] },
};
for (const w of WIDTHS) {
  const p = await browser.newPage({ viewport: { width: w, height: w < 768 ? 800 : 900 } });
  for (const [path, g] of Object.entries(GUARDED)) {
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1600); // let entrance animations settle
    const hits = await p.evaluate(({ art, keep }) => {
      const box = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length).map((e) => ({ sel, r: e.getBoundingClientRect() }));
      const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
      const out = [];
      for (const a of art.flatMap(box)) for (const k of keep.flatMap(box)) if (hit(a.r, k.r)) out.push(`${a.sel} × ${k.sel}`);
      return out;
    }, g);
    if (hits.length) fail(`${path} @${w}: sculpture overlaps ${hits.join(', ')}`);
    // Composition: on desktop the division artwork must sit fully above the fold.
    if (path.startsWith('/universe/') && w >= 1024) {
      const bottom = await p.$eval('.dv__art', (e) => e.getBoundingClientRect().bottom - innerHeight);
      if (bottom > 0) fail(`${path} @${w}: division artwork runs ${Math.round(bottom)}px below the fold`);
    }
  }
  await p.close();
}
ok('sculpture never overlaps navigation, headings or buttons (6 pages × 6 widths)');

// 6. Assets: every image decodes, lazy images stay lazy, first-load weight is bounded.
{
  for (const [w, label] of [[1440, 'desktop'], [390, 'mobile']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 800 : 900 }, deviceScaleFactor: w < 768 ? 2 : 1 });
    for (const path of ['/', '/universe/digital', '/universe/strategy']) {
      const p = await ctx.newPage();
      await p.goto(BASE + path, { waitUntil: 'networkidle' });
      const first = await p.evaluate(() => performance.getEntriesByType('resource').filter((r) => /\.(webp|png|jpe?g|avif)$/.test(r.name)).map((r) => ({ n: r.name.split('/').pop(), b: r.transferSize || r.encodedBodySize })));
      const kb = Math.round(first.reduce((a, r) => a + r.b, 0) / 1024);
      if (path === '/' && first.some((r) => /^(work-|bg-contact)/.test(r.n))) fail(`${path} ${label}: below-the-fold renders loaded eagerly: ${first.map((r) => r.n).join(', ')}`);
      if (kb > 250) fail(`${path} ${label}: ${kb} KB of images on first load (budget 250 KB)`);
      const wrongVariant = first.filter((r) => (label === 'mobile' ? /hero-card-\d|division-\w+-\d{3,4}\.webp$/.test(r.n) && !/wide|mobile/.test(r.n) : /wide|mobile/.test(r.n)));
      if (wrongVariant.length) fail(`${path} ${label}: wrong art direction served: ${wrongVariant.map((r) => r.n).join(', ')}`);
      await scrollThrough(p);
      await p.waitForLoadState('networkidle');
      const broken = await p.$$eval('img', (imgs) => imgs.filter((i) => i.getClientRects().length && i.checkVisibility() && (!i.complete || i.naturalWidth === 0)).map((i) => i.currentSrc || i.src));
      if (broken.length) fail(`${path} ${label}: images failed to decode: ${broken.join(', ')}`);
      ok(`${path} ${label}: ${first.length} image(s), ${kb} KB on first load; all images decode`);
      await p.close();
    }
    await ctx.close();
  }
}

// 7. WebGL fallback: with WebGL unavailable the hero shows the rendered still.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    const o = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : o.call(this, t, ...a); };
  });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const state = await p.evaluate(() => {
    const img = document.querySelector('.stage__fallback img');
    const c = document.querySelector('[data-sculpture]');
    return { img: !!img && img.complete && img.naturalWidth > 0, canvasHidden: getComputedStyle(c).opacity === '0' };
  });
  if (!state.img || !state.canvasHidden) fail(`no-WebGL fallback: ${JSON.stringify(state)}`); else ok('no-WebGL: hero shows the rendered still, canvas stays hidden');
  await ctx.close();
}

// 8. Brand consistency: official emblem everywhere, icons and metadata resolve.
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const asset of ['/favicon.ico', '/favicon-32.png', '/favicon-16.png', '/apple-touch-icon.png', '/site.webmanifest', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png', '/og.png', '/brand/emblem-512.png']) {
    const r = await p.request.get(BASE + asset);
    if (r.status() !== 200) fail(`brand asset ${asset} → ${r.status()}`);
  }
  for (const path of PAGES) {
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    const b = await p.evaluate(() => ({
      header: document.querySelector('.hdr__brand .logo__word')?.textContent?.trim(),
      headerEmblem: !!document.querySelector('.hdr__brand img.logo__mark[src*="/brand/emblem-"]'),
      footerEmblem: !!document.querySelector('.ftr img.logo__mark[src*="/brand/emblem-"]'),
      oldMarks: document.querySelectorAll('[src*="monogram"], [href*="favicon.svg"]').length,
      ldLogo: JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)[0].logo,
      og: document.querySelector('meta[property="og:image"]')?.content,
    }));
    if (b.header !== 'MANSAS MOGULS') fail(`${path}: header wordmark reads "${b.header}"`);
    if (!b.headerEmblem || !b.footerEmblem) fail(`${path}: crowned M missing (header ${b.headerEmblem}, footer ${b.footerEmblem})`);
    if (b.oldMarks) fail(`${path}: ${b.oldMarks} reference(s) to the old monogram`);
    if (!/emblem-512\.png$/.test(b.ldLogo) || !/og\.png$/.test(b.og)) fail(`${path}: metadata logo/og wrong (${b.ldLogo}, ${b.og})`);
  }
  ok(`brand: crowned M in header and footer on ${PAGES.length} pages; icons, manifest, OG and JSON-LD resolve`);
  await p.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nAll QA checks passed');
process.exit(failures.length ? 1 : 0);
