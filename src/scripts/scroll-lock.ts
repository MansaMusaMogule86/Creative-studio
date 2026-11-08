// Background scroll lock that also works on iOS Safari, where `overflow: hidden`
// on <body> does not stop touch scrolling. The page is pinned with
// `position: fixed` at its current offset and restored to the exact same
// position on unlock. Nested locks (menu + chat) are reference-counted.
let count = 0;
let savedY = 0;
let savedStyle: string | null = null;
let savedWidth = 0;
// Content anchor: if the viewport width changes while locked (rotation),
// the old pixel offset no longer points at the same content, so we restore
// relative to the element that was at the top of the viewport instead.
// The anchor's ancestors are recorded too: if the anchor itself is hidden in
// the new layout (a mobile-only element after rotating to landscape), the
// nearest still-rendered ancestor is used instead.
let anchors: { el: Element; top: number }[] = [];

export const isScrollLocked = () => count > 0;

export function lockScroll() {
  if (count++ > 0) return;
  const body = document.body;
  savedY = window.scrollY;
  savedStyle = body.getAttribute('style');
  savedWidth = window.innerWidth;
  anchors = [];
  for (let el = document.elementFromPoint(window.innerWidth / 2, Math.min(160, window.innerHeight / 3)); el && el !== document.body; el = el.parentElement) {
    anchors.push({ el, top: el.getBoundingClientRect().top });
  }
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  body.style.position = 'fixed';
  body.style.top = `-${savedY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
  document.documentElement.classList.add('scroll-locked');
}

export function unlockScroll() {
  if (count === 0 || --count > 0) return;
  const body = document.body;
  if (savedStyle === null) body.removeAttribute('style');
  else body.setAttribute('style', savedStyle);
  document.documentElement.classList.remove('scroll-locked');
  // 'instant' overrides the site's `scroll-behavior: smooth`, so the page
  // reappears exactly where the visitor left it, with no animated jump.
  let top = savedY;
  if (window.innerWidth !== savedWidth) {
    const a = anchors.find(({ el }) => el.isConnected && el.getClientRects().length > 0);
    if (a) top = a.el.getBoundingClientRect().top + window.scrollY - a.top;
  }
  window.scrollTo({ top, left: 0, behavior: 'instant' });
  anchors = [];
}
