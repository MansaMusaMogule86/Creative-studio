// Motion for <Living>: one rAF loop for every visible artwork on the page.
// Fine pointers tilt the artwork toward the cursor; touch screens get a slow
// autonomous drift so the piece is never static. Off-screen pieces are skipped
// and the loop stops when none are visible. Reduced motion: nothing runs.
type S = { el: HTMLElement; tx: number; ty: number; x: number; y: number; hover: boolean; on: boolean; phase: number };

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const items = new Map<HTMLElement, S>();
let raf = 0;
let t0 = performance.now();

const loop = (now: number) => {
  raf = 0;
  const t = (now - t0) / 1000;
  let any = false;
  for (const s of items.values()) {
    if (!s.on) continue;
    any = true;
    if (!s.hover) {
      // Autonomous drift (a slow Lissajous path).
      s.tx = Math.sin(t * 0.42 + s.phase) * 0.55;
      s.ty = Math.cos(t * 0.31 + s.phase * 1.3) * 0.4;
    }
    s.x += (s.tx - s.x) * 0.06;
    s.y += (s.ty - s.y) * 0.06;
    const st = s.el.style;
    st.setProperty('--rx', s.x.toFixed(4));
    st.setProperty('--ry', s.y.toFixed(4));
    st.setProperty('--gx', `${(50 + s.x * 32).toFixed(2)}%`);
    st.setProperty('--gy', `${(32 + s.y * 26).toFixed(2)}%`);
  }
  if (any && !document.hidden) raf = requestAnimationFrame(loop);
};
const kick = () => { if (!raf && !reduce) raf = requestAnimationFrame(loop); };

const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const s = items.get(e.target as HTMLElement);
    if (!s) continue;
    s.on = e.isIntersecting;
    s.el.classList.toggle('is-alive', s.on);
  }
  kick();
}, { rootMargin: '60px' });

export function registerLiving(root: ParentNode = document) {
  if (reduce) return;
  root.querySelectorAll<HTMLElement>('[data-living]').forEach((el, i) => {
    if (items.has(el)) return;
    const s: S = { el, tx: 0, ty: 0, x: 0, y: 0, hover: false, on: false, phase: i * 1.7 };
    items.set(el, s);
    io.observe(el);
    if (fine) {
      el.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = el.getBoundingClientRect();
        s.hover = true;
        s.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
        s.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
        kick();
      });
      el.addEventListener('pointerleave', () => { s.hover = false; kick(); });
    }
  });
}

registerLiving();
document.addEventListener('visibilitychange', () => { if (!document.hidden) { t0 = performance.now() - 1000; kick(); } });
