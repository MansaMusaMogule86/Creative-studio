// Loads GSAP + ScrollTrigger only when a section is about to scroll into
// view, so the ~45 KB (gzip) animation library never competes with the hero
// for the main thread on first load.
import type { gsap as GSAP } from 'gsap';
import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger';

export function whenNear(el: Element, run: (gsap: typeof GSAP, scrollTrigger: typeof ST) => void, rootMargin = '900px 0px') {
  const io = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')]);
    gsap.registerPlugin(ScrollTrigger);
    run(gsap, ScrollTrigger);
  }, { rootMargin });
  io.observe(el);
}
