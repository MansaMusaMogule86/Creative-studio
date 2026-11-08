// Decides where the single shared division canvas lives.
// Homepage: the stage inside the active universe panel (one at a time).
// Division page: its hero stage. Only when visible; three.js loads lazily.
import { isSmallScreen, liveWebGL, prefersReducedMotion } from './gpu';
import type { DivisionSlug } from './division-scenes';
import type { Stage } from './division-stage';

const stages = [...document.querySelectorAll<HTMLElement>('[data-stage]')];

if (stages.length) {
  if (!liveWebGL()) {
    document.documentElement.classList.add('stage-still');
  } else {
    const mobile = isSmallScreen();
    const reduceMotion = prefersReducedMotion();
    let stage: Stage | null = null;
    let loading: Promise<Stage> | null = null;
    const ensure = () => (stage ? Promise.resolve(stage) : (loading ??= import('./division-stage').then((m) => (stage = m.createStage({ mobile, reduceMotion })))));
    const visible = new Set<HTMLElement>();
    let timer = 0;

    const candidate = () => stages.find((s) => {
      const panel = s.closest('[data-panel]');
      const active = panel ? panel.classList.contains('is-active') : true;
      return active && visible.has(s) && s.getClientRects().length > 0;
    });

    const apply = async () => {
      const el = candidate();
      if (!el) { stage?.stop(); return; }
      const st = await ensure();
      if (candidate() !== el) return; // state changed while three.js was loading
      stages.forEach((s) => s.classList.toggle('is-live', s === el));
      st.show(el, el.dataset.stage as DivisionSlug);
      if (!document.hidden) st.start();
    };
    const schedule = () => { clearTimeout(timer); timer = window.setTimeout(apply, 160); };

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) (e.isIntersecting ? visible.add(e.target as HTMLElement) : visible.delete(e.target as HTMLElement));
      schedule();
    }, { rootMargin: '80px' });
    stages.forEach((s) => io.observe(s));
    addEventListener('universe:active', schedule);
    document.addEventListener('visibilitychange', () => (document.hidden ? stage?.stop() : schedule()));
    // Free the GPU when leaving; rebuild if the page returns from the back/forward cache.
    addEventListener('pagehide', () => { stage?.dispose(); stage = null; loading = null; stages.forEach((s) => s.classList.remove('is-live')); });
    addEventListener('pageshow', (e) => { if (e.persisted) schedule(); });
  }
}
