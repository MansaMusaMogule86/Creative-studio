// Lightweight scroll reveals. Content is visible without JS; this only adds
// motion. No scroll hijacking: we observe, never drive, the scroll position.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const els = document.querySelectorAll<HTMLElement>('[data-reveal]');

if (reduce || !('IntersectionObserver' in window)) {
  els.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

// Header state: frosted floating bar once the hero is scrolled past.
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  // While a dialog or the menu pins the page (scroll-lock), scrollY reads 0;
  // keep the header state instead of flickering back to the hero style.
  // Below 1024px the bar hides while scrolling down and returns on scroll up,
  // so it never sits over headings while reading.
  const small = matchMedia('(max-width: 1023px)');
  let lastY = scrollY;
  const onScroll = () => {
    if (document.documentElement.classList.contains('scroll-locked')) return;
    const y = scrollY;
    header.classList.toggle('is-floating', y > 40);
    const menuOpen = document.documentElement.classList.contains('menu-open');
    if (!small.matches || menuOpen || y < 120 || header.contains(document.activeElement)) header.classList.remove('is-tucked');
    else if (y > lastY + 6) header.classList.add('is-tucked');
    else if (y < lastY - 6) header.classList.remove('is-tucked');
    lastY = y;
  };
  header.addEventListener('focusin', () => header.classList.remove('is-tucked'));
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
}

// Magnetic buttons, used sparingly (only elements marked data-magnetic,
// only on fine pointers, never with reduced motion).
if (!reduce && matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.18;
      const y = (e.clientY - r.top - r.height / 2) * 0.28;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });
}
