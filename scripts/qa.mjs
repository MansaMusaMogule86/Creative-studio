// Local QA: run against `pnpm preview` (default http://localhost:4321).
//   pnpm build && pnpm preview &   then   pnpm qa
// Checks: console errors, horizontal overflow at 320–1440 px, axe (WCAG 2.1 AA),
// internal links, the inquiry form, Ask Moguls, the division explorer, reduced motion,
// artwork overlap, image loading/weight/art direction, motion and reduced motion.
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
  await p.waitForURL(/\/universe\/growth\/?(#.*)?$/);
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
  // No backend in local preview (/api/leads → 404): the form must say honestly that nothing was sent.
  await p.waitForSelector('.f-done', { timeout: 8000 }).catch(() => {});
  if (!(await p.isVisible('.f-done'))) fail('valid submit showed no confirmation');
  else if (!/nothing was sent/i.test(await p.textContent('.f-done'))) fail('without a backend the form must say nothing was sent');
  else ok(`no backend: "${(await p.textContent('.f-done h3'))}" and says nothing was sent`);

  // With a backend (route mocked like the Vercel function): payload shape, success and server errors.
  {
    const q = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    let sent = null, mode = 'ok';
    await q.route('**/api/leads', async (route) => {
      sent = JSON.parse(route.request().postData() || '{}');
      if (mode === 'ok') return route.fulfill({ status: 202, contentType: 'application/json', body: '{"ok":true}' });
      if (mode === '422') return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'invalid', errors: { email: 'Enter an email address like name@company.com.' } }) });
      return route.fulfill({ status: 429, contentType: 'application/json', body: '{"ok":false,"code":"rate_limited"}' });
    });
    await q.goto(BASE + '/?service=premium-websites&utm_source=qa&utm_campaign=launch#contact', { waitUntil: 'networkidle' });
    const fill = async () => {
      await q.fill('.f input[autocomplete=name]', 'Test Person');
      await q.fill('.f input[type=email]', 'test@company.example');
      await q.fill('.f textarea', 'We would like to discuss a new platform for our team.');
      if (!(await q.$('.f-chip input:checked'))) await q.evaluate(() => { const d = document.querySelector('.f-div'); d.open = true; d.querySelector('.f-chip input').click(); });
    };
    await fill();
    await q.click('.f button[type=submit]');
    await q.waitForSelector('.f-done', { timeout: 8000 }).catch(() => {});
    const thanks = await q.textContent('.f-done h3').catch(() => '');
    const okShape = sent && /^[0-9a-f-]{36}$/.test(sent.submissionId) && typeof sent.startedAt === 'number' && sent.website === ''
      && sent.services.includes('premium-websites') && sent.attribution?.utm_source === 'qa' && sent.attribution?.utm_campaign === 'launch' && !('submittedAt' in sent);
    if (!okShape) fail(`lead payload shape: ${JSON.stringify(sent)}`); else ok('form sends submissionId, timing, empty honeypot, services and UTM attribution');
    if (!/Thank you, Test/.test(thanks || '')) fail(`backend success not confirmed (${thanks})`); else ok(`backend 202 → "${thanks}"`);
    mode = '422';
    await q.click('.f-done button');
    await fill();
    await q.click('.f button[type=submit]');
    await q.waitForSelector('.f-summary', { timeout: 8000 }).catch(() => {});
    if (!(await q.isVisible('.f [aria-invalid=true][type=email]'))) fail('server 422 field error not shown inline'); else ok('server-side field errors are shown inline');
    mode = '429';
    await q.click('.f button[type=submit]');
    await q.waitForTimeout(800);
    if (!/too many attempts/i.test(await q.textContent('.f'))) fail('rate-limit message missing'); else ok('rate-limited submit explains the wait');
    const hp = await q.$eval('.f-hp input', (i) => ({ tab: i.tabIndex, hidden: i.closest('[aria-hidden=true]') !== null, offscreen: i.getBoundingClientRect().right <= 0 }));
    if (hp.tab !== -1 || !hp.hidden || !hp.offscreen) fail(`honeypot is reachable: ${JSON.stringify(hp)}`); else ok('honeypot field is hidden from people and assistive tech');
    await q.close();
  }

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
  '/': { art: ['.tile--stage', '.stage__pills'], keep: ['.hdr__bar', '#hero-title', '.hero__ctas', '.hero__facts', '.hero__copy'] },
  '/universe/digital': { art: ['.dv__art'], keep: ['.hdr__bar', 'h1', '.dv__ctas', '.dv__crumb', '.lede'] },
  '/universe/ai': { art: ['.dv__art'], keep: ['.hdr__bar', 'h1', '.dv__ctas', '.lede'] },
  '/universe/growth': { art: ['.dv__art'], keep: ['.hdr__bar', 'h1', '.dv__ctas', '.lede'] },
  '/universe/creative': { art: ['.dv__art'], keep: ['.hdr__bar', 'h1', '.dv__ctas', '.lede'] },
  '/universe/strategy': { art: ['.dv__art'], keep: ['.hdr__bar', 'h1', '.dv__ctas', '.lede'] },
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
    if (hits.length) fail(`${path} @${w}: artwork overlaps ${hits.join(', ')}`);
    // Composition: on desktop the division artwork must sit fully above the fold.
    if (path.startsWith('/universe/') && w >= 1024) {
      const bottom = await p.$eval('.dv__art', (e) => e.getBoundingClientRect().bottom - innerHeight);
      if (bottom > 0) fail(`${path} @${w}: division artwork runs ${Math.round(bottom)}px below the fold`);
    }
  }
  await p.close();
}
ok('artwork never overlaps navigation, headings or buttons (6 pages × 6 widths)');

// 6. Assets: every image decodes, lazy images stay lazy, first-load weight is bounded.
{
  for (const [w, label] of [[1440, 'desktop'], [390, 'mobile']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 800 : 900 }, deviceScaleFactor: w < 768 ? 2 : 1 });
    for (const path of ['/', '/universe/digital', '/universe/strategy']) {
      const p = await ctx.newPage();
      await p.goto(BASE + path, { waitUntil: 'networkidle' });
      const first = await p.evaluate(() => performance.getEntriesByType('resource').filter((r) => /\.(webp|png|jpe?g|avif)$/.test(r.name)).map((r) => ({ n: r.name.split('/').pop(), b: r.transferSize || r.encodedBodySize })));
      const kb = Math.round(first.reduce((a, r) => a + r.b, 0) / 1024);
      if (path === '/' && (await p.$$eval('.phi__art, .panel .dart img, .ct__emblem img', (imgs) => imgs.filter((i) => i.loading !== 'lazy').length))) fail(`${path} ${label}: below-the-fold artwork is not lazy-loaded`);
      // Budget 400 KB: the owner's artwork is the content (hero deck + five Universe cards on phones,
      // which the browser prefetches as they are close to the screen).
      if (kb > 400) fail(`${path} ${label}: ${kb} KB of images on first load (budget 400 KB)`);
      const wrongVariant = first.filter((r) => (label === 'mobile' ? /-1536\.webp$/.test(r.n) : false));
      if (wrongVariant.length) fail(`${path} ${label}: wrong art direction served: ${wrongVariant.map((r) => r.n).join(', ')}`);
      if (path === '/') {
        const eagerPanels = await p.$$eval('.panel .dart img', (imgs) => imgs.filter((i) => i.loading !== 'lazy').length);
        if (eagerPanels) fail(`${path} ${label}: ${eagerPanels} division panel still(s) not lazy`);
      }
      await scrollThrough(p);
      await p.waitForLoadState('networkidle');
      const broken = await p.$$eval('img', (imgs) => imgs.filter((i) => !i.hasAttribute('data-src') && i.getClientRects().length && i.checkVisibility() && (!i.complete || i.naturalWidth === 0)).map((i) => i.currentSrc || i.src));
      if (broken.length) fail(`${path} ${label}: images failed to decode: ${broken.join(', ')}`);
      ok(`${path} ${label}: ${first.length} image(s), ${kb} KB on first load; all images decode`);
      await p.close();
    }
    await ctx.close();
  }
}

// 7. Reduced motion: artwork stays still, the hero deck never advances, no canvas anywhere.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(5600);
  const st = await p.evaluate(() => ({
    active: document.querySelector('[data-deck]')?.dataset.active,
    alive: document.querySelectorAll('[data-living].is-alive').length,
    tilted: [...document.querySelectorAll('[data-living]')].filter((e) => e.style.getPropertyValue('--rx')).length,
    canvases: document.querySelectorAll('canvas').length,
    pauseHidden: document.querySelector('[data-deck-pause]')?.hidden,
  }));
  if (st.active !== '0' || st.alive || st.tilted || st.canvases || !st.pauseHidden) fail(`reduced motion: ${JSON.stringify(st)}`);
  else ok('reduced motion: artwork static, deck does not advance, no canvas');
  await ctx.close();
}

const divisionSlugs = ['digital', 'ai', 'growth', 'creative', 'strategy'];
// 7b. Every division artwork is visible without tapping, at every width (owner requirement).
{
  for (const w of [320, 375, 390, 430, 768, 1024, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 768, hasTouch: w < 1024 });
    const p = await ctx.newPage();
    for (const path of ['/', ...divisionSlugs.map((s) => `/universe/${s}`)]) {
      await p.goto(BASE + path, { waitUntil: 'networkidle' });
      const shown = await p.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
        await new Promise((r) => setTimeout(r, 700));
        const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width < 40 || r.height < 30) return false; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false; } return true; };
        return ['digital', 'ai', 'growth', 'creative', 'strategy'].filter((s) => [...document.querySelectorAll(`img[src*="division-${s}-"], img[srcset*="division-${s}-"]`)].some((i) => vis(i) && i.complete && i.naturalWidth > 0));
      });
      const need = path === '/' ? 5 : 1;
      if (shown.length < need) fail(`${path} @${w}: only ${shown.length}/${need} division artworks visible without tapping (${shown.join(', ')})`);
    }
    await ctx.close();
  }
  ok('division artworks visible without tapping on the homepage and every division page (320–1440)');
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

// 9. Search & metadata: sitemap = canonical indexable pages only; unique metadata; valid JSON-LD.
{
  const p = await browser.newPage();
  const sm = await (await p.request.get(BASE + '/sitemap-0.xml')).text();
  const smPaths = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  if (!smPaths.length) fail('sitemap has no URLs');
  const seen = { title: new Map(), desc: new Map() };
  for (const path of PAGES) {
    const r = await p.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    const m = await p.evaluate(() => {
      const q = (s) => document.querySelector(s);
      let ld = []; let ldOk = true;
      try { ld = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => JSON.parse(s.textContent)); } catch { ldOk = false; }
      return {
        title: document.title, desc: q('meta[name=description]')?.content ?? '', canonical: q('link[rel=canonical]')?.href ?? null,
        noindex: /noindex/.test(q('meta[name=robots]')?.content ?? ''), h1: document.querySelectorAll('h1').length,
        tw: ['card', 'title', 'description', 'image'].every((k) => q(`meta[name="twitter:${k}"]`)), og: !!q('meta[property="og:image"]'),
        ldOk, types: ld.map((x) => x['@type']),
      };
    });
    const inSm = smPaths.includes(path) || smPaths.includes(path + '/');
    if (r.status() !== 200) fail(`${path}: status ${r.status()}`);
    if (m.h1 !== 1) fail(`${path}: ${m.h1} h1 elements`);
    if (!m.tw || !m.og) fail(`${path}: social metadata incomplete`);
    if (!m.ldOk) fail(`${path}: JSON-LD does not parse`);
    if (m.desc.length < 50 || m.desc.length > 165) fail(`${path}: meta description length ${m.desc.length}`);
    if (m.noindex && inSm) fail(`${path}: noindex page is in the sitemap`);
    if (!m.noindex && !inSm) fail(`${path}: indexable page missing from the sitemap`);
    if (!m.noindex && (!m.canonical || new URL(m.canonical).pathname.replace(/\/$/, '') !== path.replace(/\/$/, ''))) fail(`${path}: canonical ${m.canonical}`);
    if (m.noindex && m.canonical) fail(`${path}: noindex page should not declare a canonical`);
    if (path.startsWith('/universe/') && !m.types.includes('BreadcrumbList')) fail(`${path}: BreadcrumbList missing`);
    if (path === '/' && !m.types.includes('WebSite')) fail('/: WebSite structured data missing');
    for (const k of ['title', 'desc']) { const v = k === 'title' ? m.title : m.desc; if (seen[k].has(v)) fail(`${path}: duplicate ${k} with ${seen[k].get(v)}`); seen[k].set(v, path); }
  }
  const nf = await p.goto(BASE + '/this-page-does-not-exist');
  if (nf.status() !== 404) fail(`unknown URL returned ${nf.status()}, expected 404`);
  const recovery = await p.$$eval('main a[href^="/universe/"]', (a) => a.length);
  if (recovery < 5) fail(`404 page offers ${recovery} division links`);
  const robots = await (await p.request.get(BASE + '/robots.txt')).text();
  if (!/Sitemap: /.test(robots) || /Disallow: \/\s*$/m.test(robots)) fail('production robots.txt blocks crawling or lacks the sitemap');
  ok(`search: ${smPaths.length} sitemap URLs = indexable pages; unique titles and descriptions; canonical, social, JSON-LD, 404 recovery verified`);
  await p.close();
}

// 10. Motion: the owner's artwork moves (hero deck, 3D tilt/float, One Team), and nothing is a placeholder.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  const a0 = await p.evaluate(() => document.querySelector('[data-deck]').dataset.active);
  await p.waitForTimeout(5200);
  const a1 = await p.evaluate(() => document.querySelector('[data-deck]').dataset.active);
  if (a0 === a1) fail(`hero deck did not advance (${a0} → ${a1})`); else ok(`hero deck turns on its own (${a0} → ${a1})`);
  const tilt = async () => p.evaluate(() => document.querySelector('.deck__card[data-pos="0"] [data-living]').style.getPropertyValue('--rx'));
  const t0 = await tilt(); await p.waitForTimeout(700); const t1 = await tilt();
  if (!t0 || t0 === t1) fail(`hero artwork 3D tilt is not moving (${t0} → ${t1})`); else ok('hero artwork drifts in 3D (tilt changes every frame)');
  await p.hover('.stage__pills a >> nth=4');
  await p.waitForTimeout(400);
  if ((await p.evaluate(() => document.querySelector('[data-deck]').dataset.active)) !== '4') fail('hovering a division pill does not bring its artwork forward');
  else ok('hovering a division pill brings its artwork forward');
  await p.evaluate(() => document.querySelector('.phi__diagram').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(1800);
  await p.hover('.spot >> nth=1', { force: true });
  await p.waitForTimeout(500);
  const ph = await p.evaluate(() => ({ lit: document.querySelector('.spot.is-active')?.querySelector('.orb__k')?.textContent, cap: document.querySelector('[data-cap]').textContent, art: document.querySelector('.phi__art').currentSrc }));
  if (ph.lit !== 'Engineering' || !ph.cap.startsWith('Engineering') || !ph.art.includes('/art/one-team-')) fail(`one team hover: ${JSON.stringify(ph)}`);
  else ok('one team: owner artwork, hover lights Engineering and shows its role');
  const labels = await p.evaluate(() => /placeholder|concept render/i.test(document.querySelector('main').innerText));
  if (labels) fail('homepage still shows PLACEHOLDER / CONCEPT RENDER labels'); else ok('no placeholder or concept-render labels on the homepage');
  const canv = await p.evaluate(() => document.querySelectorAll('canvas').length);
  if (canv) fail(`homepage still renders ${canv} generated canvas(es)`); else ok('no generated 3D canvases: only the owner artwork is shown');
  // Division artworks are the owner's images, shown whole and unaltered.
  for (const slug of ['digital', 'ai', 'growth', 'creative', 'strategy']) {
    await p.goto(BASE + `/universe/${slug}`, { waitUntil: 'networkidle' });
    const a = await p.evaluate(() => { const i = document.querySelector('.dv__art img'); const fig = i.closest('figure'); return { src: i.currentSrc, nat: i.naturalWidth / i.naturalHeight, box: i.offsetWidth / i.offsetHeight, overlays: fig.querySelectorAll('figcaption, canvas').length, fit: getComputedStyle(i).objectFit }; });
    if (!a.src.includes(`/art/division-${slug}-`) || Math.abs(a.nat - 1.5) > 0.01 || Math.abs(a.box - 1.5) > 0.02 || a.overlays || a.fit !== 'contain') fail(`/universe/${slug}: artwork not shown whole (${JSON.stringify(a)})`);
    else ok(`/universe/${slug}: owner artwork shown whole at 3:2, no overlay`);
  }
  await ctx.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nAll QA checks passed');
process.exit(failures.length ? 1 : 0);
