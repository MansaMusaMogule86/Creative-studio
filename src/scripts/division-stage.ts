// One WebGL renderer (one context) shared by every division artwork on a page.
// The single canvas moves to whichever stage is active, scenes are built on
// demand and cached (max 2 on small screens), the loop pauses off-screen, the
// pixel ratio adapts to measured frame time, and everything is disposed on
// teardown. Reduced motion renders a single still frame.
import {
  ACESFilmicToneMapping, Color, DirectionalLight, Mesh, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene,
  ShaderMaterial, SRGBColorSpace, WebGLRenderer, type Texture,
} from 'three';
import { BUILDERS, disposeTree, envScene, type DivisionArt, type DivisionSlug, type Pointer } from './division-scenes';

type Entry = { scene: Scene; art: DivisionArt; camera: PerspectiveCamera; backdrop: ShaderMaterial; env: Texture };
export type StageOptions = { mobile: boolean; reduceMotion: boolean; preserveDrawingBuffer?: boolean };

const backdropMaterial = (fields: [string, string, string]) => new ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uAspect: { value: 1 }, uC1: { value: new Color(fields[0]) }, uC2: { value: new Color(fields[1]) }, uC3: { value: new Color(fields[2]) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
  fragmentShader: `varying vec2 vUv; uniform float uTime; uniform float uAspect; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
    float blob(vec2 p, vec2 c, float r){ return smoothstep(r, 0.0, length(p - c)); }
    void main(){ vec2 p = vUv; p.x *= uAspect; float t = uTime * 0.05;
      vec3 col = vec3(0.975, 0.97, 1.0);
      col = mix(col, uC1, 0.7 * blob(p, vec2(uAspect*(0.75 + 0.05*sin(t*3.0)), 0.75), 0.8));
      col = mix(col, uC2, 0.6 * blob(p, vec2(uAspect*(0.2 + 0.05*cos(t*2.0)), 0.6), 0.7));
      col = mix(col, uC3, 0.55 * blob(p, vec2(uAspect*0.55, 0.05 + 0.04*sin(t*2.3)), 0.6));
      col = mix(col, vec3(0.98, 0.93, 0.82), 0.15 * blob(p, vec2(uAspect*0.5, 0.45), 0.4));
      col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453) - 0.5) / 255.0;
      gl_FragColor = vec4(col, 1.0); }`,
  depthWrite: false, depthTest: false,
});

export function createStage(opts: StageOptions) {
  const canvas = document.createElement('canvas');
  canvas.className = 'dstage__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new WebGLRenderer({ canvas, antialias: !opts.mobile, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserveDrawingBuffer });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  // Cheaper refraction buffer on phones.
  (renderer as unknown as { transmissionResolutionScale?: number }).transmissionResolutionScale = opts.mobile ? 0.5 : 1;
  const pmrem = new PMREMGenerator(renderer);

  const maxDpr = Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 2);
  let dpr = maxDpr;
  renderer.setPixelRatio(dpr);

  const cache = new Map<DivisionSlug, Entry>();
  const order: DivisionSlug[] = [];
  const maxCached = opts.mobile ? 2 : 5;
  let current: { slug: DivisionSlug; entry: Entry } | null = null;
  let running = false, raf = 0, last = 0, time = 0, frames = 0, slowAccum = 0, skip = false, skipToggle = false;
  const pointer: Pointer = { x: 0, y: 0 }, target: Pointer = { x: 0, y: 0 };

  const build = (slug: DivisionSlug): Entry => {
    const art = BUILDERS[slug]();
    const scene = new Scene();
    const envSc = envScene(art.env);
    const env = pmrem.fromScene(envSc, 0.03).texture;
    disposeTree(envSc);
    scene.environment = env;
    const backdrop = backdropMaterial(art.fields);
    const bg = new Mesh(new PlaneGeometry(2, 2), backdrop); bg.frustumCulled = false; bg.renderOrder = -1;
    scene.add(bg, art.root);
    const key = new DirectionalLight('#fff4de', 1.2); key.position.set(3, 5, 6); scene.add(key);
    const rim = new DirectionalLight('#e8c98a', 0.7); rim.position.set(-5, 2, -4); scene.add(rim);
    const camera = new PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.35, art.cameraZ);
    camera.lookAt(0, -0.05, 0);
    return { scene, art, camera, backdrop, env };
  };
  const evict = (slug: DivisionSlug) => {
    const e = cache.get(slug);
    if (!e) return;
    disposeTree(e.scene); e.env.dispose(); cache.delete(slug);
    order.splice(order.indexOf(slug), 1);
  };
  const get = (slug: DivisionSlug) => {
    let e = cache.get(slug);
    if (!e) {
      e = build(slug); cache.set(slug, e); order.push(slug);
      while (order.length > maxCached) { const old = order.find((s) => s !== slug)!; evict(old); }
    }
    return e;
  };

  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent || !current) return;
    const w = parent.clientWidth, h = parent.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const cam = current.entry.camera;
    cam.aspect = w / h;
    // Keep the whole object in frame on tall/narrow containers.
    cam.fov = w / h < 1 ? 30 / Math.max(0.62, w / h) : 30;
    cam.updateProjectionMatrix();
    current.entry.backdrop.uniforms.uAspect.value = w / h;
  };
  const ro = new ResizeObserver(() => { resize(); if (!running) renderOnce(); });

  const renderOnce = (t = time) => {
    if (!current) return;
    const { entry } = current;
    entry.art.update(t, 1 / 60, pointer);
    entry.backdrop.uniforms.uTime.value = t;
    // Moving reflections: slowly rotate the environment.
    (entry.scene as unknown as { environmentRotation?: { y: number } }).environmentRotation!.y = t * 0.08;
    renderer.render(entry.scene, entry.camera);
  };

  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    // Adaptive quality: drop pixel ratio, then frame rate, if frames are slow.
    frames++; slowAccum += dt;
    if (frames === 45) {
      const avg = slowAccum / frames; frames = 0; slowAccum = 0;
      if (avg > 0.024 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); resize(); }
      else if (avg > 0.03 && dpr <= 1) skip = true;
      else if (avg < 0.014 && dpr < maxDpr) { dpr = Math.min(maxDpr, dpr + 0.25); renderer.setPixelRatio(dpr); resize(); }
    }
    if (skip && (skipToggle = !skipToggle)) return;
    time += dt;
    pointer.x += (target.x - pointer.x) * 0.06;
    pointer.y += (target.y - pointer.y) * 0.06;
    renderOnce(time);
  };

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  if (!opts.reduceMotion) addEventListener('pointermove', onPointer, { passive: true });

  return {
    canvas,
    /** Move the canvas into `container` and show `slug` there. */
    show(container: HTMLElement, slug: DivisionSlug) {
      if (canvas.parentElement !== container) { ro.disconnect(); container.appendChild(canvas); ro.observe(container); }
      if (current?.slug !== slug) { current = { slug, entry: get(slug) }; time = opts.reduceMotion ? 2.5 : 0; }
      resize();
      renderOnce(opts.reduceMotion ? 2.5 : time);
    },
    start() {
      if (running || opts.reduceMotion || !current) return;
      running = true; last = performance.now(); raf = requestAnimationFrame(frame);
    },
    stop() { running = false; cancelAnimationFrame(raf); },
    renderAt(t: number) { renderOnce(t); },
    dispose() {
      running = false; cancelAnimationFrame(raf); ro.disconnect();
      removeEventListener('pointermove', onPointer);
      [...cache.keys()].forEach(evict);
      pmrem.dispose(); renderer.dispose(); renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
export type Stage = ReturnType<typeof createStage>;
