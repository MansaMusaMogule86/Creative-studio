// Mobile interaction QA (run against `pnpm preview`):   pnpm qa:mobile
// Covers the chat dialog journey, scroll restoration, rotation, the mobile
// menu, division controls and the inquiry form at 360/390/430/768.
//
// Limits: Chromium touch emulation cannot raise a real on-screen keyboard.
// The keyboard is simulated by shrinking the viewport height, which exercises
// the visualViewport sizing path; iOS Safari panning behaviour must still be
// checked on a real device.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.QA_URL ?? 'http://localhost:4321';
const SIZES = [[360, 800], [390, 844], [430, 932], [768, 1024]];
const failures = [];
const fail = (m) => { failures.push(m); console.log('  ✗', m); };
const ok = (m) => console.log('  ✓', m);
const near = (a, b, tol = 2) => Math.abs(a - b) <= tol;

const browser = await chromium.launch();

for (const [w, h] of SIZES) {
  const tag = `${w}×${h}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: true, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  const fullscreenExpected = w < 768;

  // 1. Scroll halfway and remember the position.
  const y0 = await p.evaluate(() => { const y = Math.round(document.body.scrollHeight * 0.45); scrollTo({ top: y, behavior: 'instant' }); return y; });
  await p.waitForTimeout(500);
  const before = await p.evaluate(() => scrollY);
  if (!near(before, y0, 4)) fail(`${tag}: could not scroll to ${y0} (at ${before})`);

  // 2. Open chat from the launcher.
  await p.tap('.ask__launch');
  await p.waitForTimeout(650);
  const s1 = await p.evaluate(() => {
    const d = document.querySelector('.ask__panel');
    const r = d.getBoundingClientRect();
    const hdr = document.querySelector('.hdr__bar').getBoundingClientRect();
    const hit = document.elementFromPoint(hdr.left + 20, hdr.top + hdr.height / 2);
    const launch = document.querySelector('.ask__launch');
    return {
      open: d.open, modal: d.matches(':modal'), top: r.top, height: r.height, vh: innerHeight, width: r.width, vw: innerWidth,
      headerCovered: !!hit && d.contains(hit),
      launcherHidden: getComputedStyle(launch).visibility === 'hidden',
      autofocusedInput: document.activeElement?.tagName === 'TEXTAREA',
      title: d.querySelector('#' + CSS.escape(d.getAttribute('aria-labelledby')))?.textContent,
      closeBtn: (() => { const c = d.querySelector('.ask__close').getBoundingClientRect(); return c.width >= 44 && c.height >= 44 && c.top >= 0; })(),
      bodyTop: document.body.style.top,
    };
  });
  if (!s1.open) fail(`${tag}: chat did not open`);
  if (fullscreenExpected) {
    if (!s1.modal) fail(`${tag}: chat is not a modal dialog`);
    if (!near(s1.top, 0) || !near(s1.height, s1.vh) || !near(s1.width, s1.vw)) fail(`${tag}: dialog not viewport-filling (${JSON.stringify(s1)})`);
    if (!s1.headerCovered) fail(`${tag}: site header still above the chat`);
    if (!s1.launcherHidden) fail(`${tag}: launcher still visible while open`);
    if (s1.autofocusedInput) fail(`${tag}: input autofocused on open`);
    if (s1.bodyTop !== `-${before}px`) fail(`${tag}: background not locked at ${before} (top=${s1.bodyTop})`);
  } else if (s1.modal) fail(`${tag}: tablet should keep the floating panel`);
  if (s1.title !== 'Ask Moguls' || !s1.closeBtn) fail(`${tag}: title/close not accessible (${s1.title}, close ok=${s1.closeBtn})`);
  if (!errs.length && s1.open) ok(`${tag}: chat opens ${s1.modal ? 'as a full-screen modal above the header, no autofocus, background locked' : 'as the floating panel'}`);

  // 3. Tap the input, type a multiline message.
  await p.tap('.ask__form textarea');
  const hBefore = await p.$eval('.ask__form textarea', (t) => t.getBoundingClientRect().height);
  if (fullscreenExpected) await p.keyboard.type('We lose enquiries after hours\nand need faster replies\nfor our website\nand phone calls\nplease help');
  else await p.fill('.ask__form textarea', 'We lose enquiries after hours\nand need faster replies\nfor our website\nand phone calls\nplease help');
  const ta = await p.$eval('.ask__form textarea', (t) => ({ v: t.value, h: t.getBoundingClientRect().height, fs: parseFloat(getComputedStyle(t).fontSize), sh: t.scrollHeight }));
  if (fullscreenExpected && !ta.v.includes('\n')) fail(`${tag}: Enter did not insert a new line on touch`);
  if (ta.fs < 16) fail(`${tag}: textarea font ${ta.fs}px (<16 causes iOS zoom)`);
  if (ta.h > 122 || ta.h <= hBefore) fail(`${tag}: textarea growth wrong (${hBefore}→${ta.h})`);
  else ok(`${tag}: multiline input grows ${Math.round(hBefore)}→${Math.round(ta.h)}px, capped at 120px, 16px text`);

  // 4. Simulated keyboard: shrink the visible height; composer must stay visible, header too.
  if (fullscreenExpected) {
    await p.setViewportSize({ width: w, height: Math.round(h * 0.55) });
    await p.waitForTimeout(300);
    const k = await p.evaluate(() => {
      const d = document.querySelector('.ask__panel');
      const f = d.querySelector('.ask__form').getBoundingClientRect();
      const hd = d.querySelector('.ask__head').getBoundingClientRect();
      const lg = d.querySelector('.ask__log').getBoundingClientRect();
      return { vh: visualViewport.height, formBottom: f.bottom, headTop: hd.top, logH: lg.height, scrollY, dialogH: d.getBoundingClientRect().height };
    });
    if (k.formBottom > k.vh + 1 || k.headTop < -1) fail(`${tag}: with keyboard, header/composer not both visible (${JSON.stringify(k)})`);
    else ok(`${tag}: simulated keyboard: dialog ${Math.round(k.dialogH)}px fits ${Math.round(k.vh)}px, header and composer visible, log ${Math.round(k.logH)}px`);
  }

  // 5. Send, build up a conversation, scroll it.
  await p.tap('.ask__send');
  for (const i of [0, 1, 2]) {
    await p.fill('.ask__form textarea', ['I need a premium website.', 'How can I generate more leads?', 'Can you build a custom SaaS platform?'][i]);
    await p.tap('.ask__send');
  }
  await p.waitForTimeout(400);
  const logState = await p.evaluate(() => { const l = document.querySelector('.ask__log'); return { atBottom: l.scrollHeight - l.scrollTop - l.clientHeight < 4, scrollable: l.scrollHeight > l.clientHeight, pageY: scrollY }; });
  if (!logState.scrollable) fail(`${tag}: conversation not scrollable after 4 exchanges`);
  if (!logState.atBottom) fail(`${tag}: log not at the latest message after sending`);
  // Scroll up deliberately, then change viewport (keyboard dismiss): must not be pulled down.
  await p.evaluate(() => { const l = document.querySelector('.ask__log'); l.scrollTop = 0; l.dispatchEvent(new Event('scroll')); });
  await p.waitForTimeout(100);
  if (fullscreenExpected) { await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(300); }
  const kept = await p.$eval('.ask__log', (l) => l.scrollTop);
  if (kept > 4) fail(`${tag}: reading position not kept (scrollTop ${kept})`);
  else ok(`${tag}: conversation scrolls independently; reading position kept after keyboard dismiss`);

  // 6. Close and verify exact page restoration + focus return.
  await p.tap('.ask__close');
  await p.waitForTimeout(400);
  const after = await p.evaluate(() => ({ y: scrollY, open: document.querySelector('.ask__panel').open, focus: document.activeElement?.className, locked: document.documentElement.classList.contains('scroll-locked'), bodyStyle: document.body.getAttribute('style') }));
  if (after.open) fail(`${tag}: chat did not close`);
  if (!near(after.y, before, 1)) fail(`${tag}: page moved from ${before} to ${after.y}`);
  if (after.locked || after.bodyStyle) fail(`${tag}: scroll lock not released (${after.bodyStyle})`);
  if (!String(after.focus).includes('ask__launch')) fail(`${tag}: focus not returned to launcher (${after.focus})`);
  if (!after.open && near(after.y, before, 1) && String(after.focus).includes('ask__launch')) ok(`${tag}: closed; page restored to exactly ${after.y}px; focus back on launcher`);

  // 7. Reopen (history kept), close with Escape where a keyboard exists.
  await p.tap('.ask__launch');
  await p.waitForTimeout(300);
  const kept2 = await p.$$eval('.ask__log .msg', (m) => m.length);
  if (kept2 < 8) fail(`${tag}: conversation lost on reopen (${kept2})`);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  const esc = await p.evaluate(() => ({ open: document.querySelector('.ask__panel').open, y: scrollY }));
  if (esc.open || !near(esc.y, before, 1)) fail(`${tag}: Escape close failed or moved page (${JSON.stringify(esc)})`);
  else ok(`${tag}: reopened with history; Escape closes without moving the page`);

  // 8. Rotate while open. Pixel offsets change with width, so check that the
  // same content is back at the top of the viewport.
  const probe = await p.evaluate(() => { const el = document.elementFromPoint(innerWidth / 2, Math.min(160, innerHeight / 3)); el.setAttribute('data-probe', ''); return el.getBoundingClientRect().top; });
  await p.tap('.ask__launch');
  await p.waitForTimeout(300);
  await p.setViewportSize({ width: h, height: w });
  await p.waitForTimeout(500);
  const rot = await p.evaluate(() => { const d = document.querySelector('.ask__panel'); const r = d.getBoundingClientRect(); return { open: d.open, modal: d.matches(':modal'), h: r.height, vh: innerHeight, locked: document.documentElement.classList.contains('scroll-locked') }; });
  const expectModal = h < 768 || w <= 520;
  if (!rot.open) fail(`${tag}: chat closed on rotation`);
  else if (rot.modal !== expectModal) fail(`${tag}: rotated mode wrong (modal=${rot.modal}, expected ${expectModal})`);
  else if (rot.modal && !near(rot.h, rot.vh)) fail(`${tag}: rotated dialog not full height`);
  else if (rot.modal !== rot.locked) fail(`${tag}: scroll lock out of sync after rotation`);
  else ok(`${tag}: rotation to ${h}×${w} keeps chat open as ${rot.modal ? 'full-screen modal' : 'floating panel'}`);
  // Close in the rotated orientation: the lock restores by content anchor.
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
  const probeTop = await p.evaluate(() => document.querySelector('[data-probe]').getBoundingClientRect().top);
  // Only the locked (modal) case is ours to restore; the floating panel never
  // locks the page, so tablet reflow on rotation is the browser's own anchoring.
  if (!rot.modal) ok(`${tag}: floating panel never locks the page; rotation reflow left to the browser`);
  else if (Math.abs(probeTop - probe) > 4) fail(`${tag}: closing after rotation moved the content (${Math.round(probe)}→${Math.round(probeTop)}px)`);
  else ok(`${tag}: closing after rotation keeps the same content at the same place (Δ${Math.round(probeTop - probe)}px)`);
  await p.setViewportSize({ width: w, height: h });
  await p.waitForTimeout(300);

  // 9. Mobile menu navigation (phones and tablet use the menu below 1024px).
  await p.evaluate(() => scrollTo({ top: 300, behavior: 'instant' }));
  await p.tap('[data-menu-toggle]');
  await p.waitForTimeout(300);
  const menuLocked = await p.evaluate(() => document.documentElement.classList.contains('scroll-locked') && document.querySelector('main').inert);
  if (!menuLocked) fail(`${tag}: menu does not lock/inert the page`);
  await p.tap('#mobile-menu a[href="/#contact"]');
  // Wait for the smooth anchor scroll to settle.
  let last = -1;
  for (let i = 0; i < 30; i++) { await p.waitForTimeout(150); const y = await p.evaluate(() => scrollY); if (y === last) break; last = y; }
  await p.waitForTimeout(700);
  const nav = await p.evaluate(() => { const h2 = document.getElementById('ct-title').getBoundingClientRect(); const bar = document.querySelector('.hdr__bar').getBoundingClientRect(); return { menuHidden: document.getElementById('mobile-menu').hidden, headingTop: h2.top, barBottom: bar.bottom, locked: document.documentElement.classList.contains('scroll-locked') }; });
  if (!nav.menuHidden || nav.locked) fail(`${tag}: menu did not close cleanly`);
  else if (nav.headingTop < nav.barBottom) fail(`${tag}: anchor lands under the header (${Math.round(nav.headingTop)} < ${Math.round(nav.barBottom)})`);
  else ok(`${tag}: menu locks page, Contact link closes it and lands below the header`);

  // 10. Launcher stays out of the form; contact form still validates.
  const launcherOverForm = await p.evaluate(() => getComputedStyle(document.querySelector('.ask__launch')).visibility !== 'hidden' && innerWidth < 768);
  if (launcherOverForm) fail(`${tag}: launcher floats over the contact form`);
  await p.tap('.f button[type=submit]');
  await p.waitForTimeout(300);
  if (!(await p.isVisible('.f-summary'))) fail(`${tag}: contact form validation not shown`);
  else ok(`${tag}: contact form validates${w < 768 ? '; launcher hidden over the form' : ''}`);

  // 11. Division control (tap accordion below 1024px).
  await p.evaluate(() => document.getElementById('universe').scrollIntoView({ behavior: 'instant' }));
  await p.tap('[data-panel]:nth-child(3) .panel__btn');
  const div = await p.$eval('[data-panel]:nth-child(3) .panel__btn', (b) => b.getAttribute('aria-expanded'));
  if (div !== 'true') fail(`${tag}: division tap control failed`); else ok(`${tag}: division tap control works`);

  if (errs.length) fail(`${tag}: page errors: ${errs.join(' | ')}`);
  await ctx.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nAll mobile interaction checks passed');
process.exit(failures.length ? 1 : 0);
