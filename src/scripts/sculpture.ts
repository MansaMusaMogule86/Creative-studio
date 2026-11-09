// The hero centrepiece: a liquid-glass ribbon that traces the twin-arch M.
// Loaded lazily after first paint; the hero is fully usable without it.
import {
  ACESFilmicToneMapping, BackSide, BufferAttribute, BufferGeometry, CatmullRomCurve3, Color,
  DirectionalLight, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, PerspectiveCamera,
  PlaneGeometry, PMREMGenerator, Scene, ShaderMaterial, SphereGeometry, SRGBColorSpace, Vector3,
  WebGLRenderer, CanvasTexture,
} from 'three';

export type Palette = {
  /** Three key light colours that tint the reflections. */
  lights: [string, string, string];
  /** Colour carried inside the glass (attenuation + sheen). */
  tint: string;
  /** Three soft fields painted on the backdrop. */
  fields: [string, string, string];
};
type Options = {
  reduceMotion: boolean;
  mobile: boolean;
  palette?: Palette;
  /** Render one deterministic frame (used by scripts/render-stills.mjs). */
  still?: { t: number; rx: number; ry: number; rz?: number; fit?: number; x?: number; y?: number };
};

export const DEFAULT_PALETTE: Palette = {
  lights: ['#a58cff', '#5fd6d8', '#ffb08f'],
  tint: '#b9a5ff',
  fields: ['#ccbdff', '#a8eded', '#ffd6c2'],
};

const PATH: [number, number, number][] = [
  [-2.0, -1.3, 0.3], [-2.0, 0.9, 0.45], [-0.85, 2.05, 0.65], [0.3, 0.95, 0.35],
  [0.38, -1.05, -0.1], [-0.05, -1.55, -0.75], [-0.38, -0.55, -0.65], [-0.36, 0.9, -0.3],
  [0.85, 2.05, 0.05], [2.0, 0.9, 0.35], [2.0, -1.3, 0.45], [1.05, -1.95, -0.85], [-1.05, -1.95, -0.85],
];

export function mountSculpture(canvas: HTMLCanvasElement, opts: Options) {
  const pal = opts.palette ?? DEFAULT_PALETTE;
  const renderer = new WebGLRenderer({ canvas, antialias: !opts.mobile, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.still });
  renderer.setPixelRatio(Math.min(devicePixelRatio, opts.mobile ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  // ── Environment: soft studio with lavender / aqua / peach light cards ──
  const env = new Scene();
  env.add(new Mesh(new SphereGeometry(20, 32, 16), new MeshBasicMaterial({ color: new Color('#f6f3ff').multiplyScalar(1.7), side: BackSide })));
  const card = (color: string, pos: [number, number, number], s: [number, number], i = 1) => {
    const m = new Mesh(new PlaneGeometry(...s), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(i), side: DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
  };
  card(pal.lights[0], [-9, 4, 4], [8, 10], 2.2);
  card(pal.lights[1], [9, -2, 5], [7, 9], 2.0);
  card(pal.lights[2], [2, -9, 3], [10, 5], 2.0);
  card('#ffffff', [0, 9, 6], [12, 3], 3.2);
  card('#d9a8ff', [-4, -3, -9], [10, 8], 1.8);
  // Champagne-gold light cards: warm highlights on the glass edges.
  card('#e8c98a', [-8, -6, 2], [4, 6], 1.9);
  card('#f5e5ba', [7, 8, 3], [2.2, 9], 2.4);
  card('#d4a43b', [-2, 10, -6], [9, 1.2], 1.4);
  card('#7fb4ff', [7, 6, -6], [5, 7], 1.8);
  card('#ffffff', [4, 2, 10], [3, 8], 2.6);
  // Thin ink strips give the glass defined, darker rims, as in a studio shot.
  card('#25243c', [-6, 0, 8], [0.8, 14], 1);
  card('#25243c', [10, 3, -2], [0.6, 12], 1);
  card('#3a3460', [0, -10, -4], [14, 0.8], 1);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.035).texture;

  // ── Backdrop: pearl with slowly drifting light fields ──
  const backdropMat = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAspect: { value: 1 }, uC1: { value: new Color(pal.fields[0]) }, uC2: { value: new Color(pal.fields[1]) }, uC3: { value: new Color(pal.fields[2]) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uAspect; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
      float blob(vec2 p, vec2 c, float r){ return smoothstep(r, 0.0, length(p - c)); }
      void main(){
        vec2 p = vUv; p.x *= uAspect; float t = uTime * 0.05;
        vec3 col = vec3(0.973, 0.969, 1.0);
        col = mix(col, uC1, 0.62 * blob(p, vec2(uAspect*(0.72 + 0.06*sin(t*3.0)), 0.70 + 0.05*cos(t*2.0)), 0.75));
        col = mix(col, uC2, 0.55 * blob(p, vec2(uAspect*(0.92 + 0.05*cos(t*2.3)), 0.22 + 0.06*sin(t*1.7)), 0.7));
        col = mix(col, uC3, 0.5 * blob(p, vec2(uAspect*(0.18 + 0.05*sin(t*1.9)), 0.12 + 0.04*cos(t*2.6)), 0.65));
        // Very subtle champagne ambient behind the sculpture's centre.
        col = mix(col, vec3(0.97, 0.90, 0.74), 0.22 * blob(p, vec2(uAspect*0.5, 0.52), 0.42));
        col += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453) - 0.5) / 255.0;
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthWrite: false, depthTest: false,
  });
  const backdrop = new Mesh(new PlaneGeometry(2, 2), backdropMat);
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -1;
  scene.add(backdrop);

  // ── Ribbon geometry, rebuilt on the CPU each frame for the liquid motion ──
  const curve = new CatmullRomCurve3(PATH.map((p) => new Vector3(...p)), true, 'centripetal', 0.5);
  const SEG = opts.mobile ? 260 : 420;
  const RAD = opts.mobile ? 20 : 28;
  const frames = curve.computeFrenetFrames(SEG, true);
  const centres = curve.getSpacedPoints(SEG);
  const vCount = (SEG + 1) * (RAD + 1);
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const idx: number[] = [];
  for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) {
    const a = i * (RAD + 1) + j, b = (i + 1) * (RAD + 1) + j;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('normal', new BufferAttribute(nor, 3));
  geo.setIndex(idx);

  const N = new Vector3(), B = new Vector3();
  const build = (time: number) => {
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG;
      const k = i % SEG;
      const c = centres[k];
      const twist = u * Math.PI * 4 + Math.sin(u * Math.PI * 2 + time * 0.6) * 0.9;
      const w = 0.44 * (0.72 + 0.28 * Math.sin(u * Math.PI * 6 + time * 0.8));
      const h = 0.085;
      const ct = Math.cos(twist), st = Math.sin(twist);
      N.copy(frames.normals[k]).multiplyScalar(ct).addScaledVector(frames.binormals[k], st);
      B.copy(frames.binormals[k]).multiplyScalar(ct).addScaledVector(frames.normals[k], -st);
      for (let j = 0; j <= RAD; j++) {
        const th = (j / RAD) * Math.PI * 2;
        const cx = Math.cos(th), sy = Math.sin(th);
        const o = (i * (RAD + 1) + j) * 3;
        pos[o] = c.x + N.x * cx * w + B.x * sy * h;
        pos[o + 1] = c.y + N.y * cx * w + B.y * sy * h;
        pos[o + 2] = c.z + N.z * cx * w + B.z * sy * h;
        let nx = cx / w, ny = sy / h; const l = Math.hypot(nx, ny); nx /= l; ny /= l;
        nor[o] = N.x * nx + B.x * ny; nor[o + 1] = N.y * nx + B.y * ny; nor[o + 2] = N.z * nx + B.z * ny;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.normal.needsUpdate = true;
    geo.computeBoundingSphere();
  };
  build(0);

  const glass = new MeshPhysicalMaterial({
    color: '#ffffff', metalness: 0.1, roughness: 0.08,
    transmission: 0.9, thickness: 1.6, ior: 1.45,
    iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [250, 950],
    sheen: 0.6, sheenColor: new Color(pal.tint).lerp(new Color('#ffffff'), 0.4), sheenRoughness: 0.35,
    clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2,
    attenuationColor: new Color(pal.tint), attenuationDistance: 1.4,
    side: DoubleSide,
  });
  const ribbon = new Mesh(geo, glass);

  const group = new Group();
  group.add(ribbon);
  scene.add(group);

  // Soft contact shadow, like a studio product shot.
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const g = sc.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(90,70,160,0.55)'); grad.addColorStop(1, 'rgba(90,70,160,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const shadow = new Mesh(new PlaneGeometry(6, 1.2), new MeshBasicMaterial({ map: new CanvasTexture(sc), transparent: true, depthWrite: false, opacity: 0.35 }));
  scene.add(shadow);

  const key = new DirectionalLight('#fff4de', 1.4);
  key.position.set(3, 5, 6);
  scene.add(key);
  const rim = new DirectionalLight('#e8c98a', 0.9); // warm gold rim from behind-left
  rim.position.set(-5, 2, -4);
  scene.add(rim);

  // ── Layout: sculpture right of the headline on wide screens, above it on narrow ──
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    backdropMat.uniforms.uAspect.value = w / h;
    // The sculpture now lives inside the hero's bento card: centre it and fit
    // it to whichever side of the card is shorter.
    const visH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const s = Math.min((visH * (w / h)) / 6.0, visH / 5.8) * (opts.still?.fit ?? 1);
    group.scale.setScalar(s);
    // Optional offsets (fractions of the visible frame) let still renders
    // place the sculpture beside text instead of centring it.
    const visW = visH * (w / h);
    group.position.set((opts.still?.x ?? 0) * visW, 0.25 * s + (opts.still?.y ?? 0) * visH, 0);
    shadow.position.set(group.position.x, group.position.y - 2.6 * s, -1);
    shadow.scale.setScalar(s);
  };

  // ── Interaction ──
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  let hasMouse = false;
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    hasMouse = true;
    const r = canvas.getBoundingClientRect();
    target.x = Math.max(-1.5, Math.min(1.5, ((e.clientX - r.left) / r.width - 0.5) * 2));
    target.y = Math.max(-1.5, Math.min(1.5, ((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  if (!opts.reduceMotion) addEventListener('pointermove', onPointer, { passive: true });

  let visible = true;
  let running = false, raf = 0, last = performance.now(), time = 0;
  const intro = { v: opts.reduceMotion ? 1 : 0 };
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    time += dt;
    intro.v = Math.min(1, intro.v + dt / 2.2);
    const e = 1 - Math.pow(1 - intro.v, 4);
    build(time);
    // Touch devices have no hover: drift as if a pointer were gently circling.
    if (!hasMouse) { target.x = Math.sin(time * 0.33) * 0.75; target.y = Math.cos(time * 0.27) * 0.35; }
    cur.x += (target.x - cur.x) * 0.04;
    cur.y += (target.y - cur.y) * 0.04;
    // Continuous, clearly visible motion: a slow sway plus pointer response.
    group.rotation.y = -0.22 + Math.sin(time * 0.31) * 0.55 + cur.x * 0.4 + (1 - e) * 1.2;
    group.rotation.x = 0.12 + Math.sin(time * 0.2) * 0.08 + cur.y * 0.18;
    group.rotation.z = -0.05 + Math.sin(time * 0.17) * 0.05;
    ribbon.position.y = Math.sin(time * 0.7) * 0.14 - (1 - e) * 0.6;
    ribbon.scale.setScalar(0.86 + 0.14 * e);
    (shadow.material as MeshBasicMaterial).opacity = 0.32 * e - Math.sin(time * 0.7) * 0.04;
    backdropMat.uniforms.uTime.value = time;
    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (running || opts.reduceMotion || opts.still || !visible || document.hidden) return;
    running = true; last = performance.now(); raf = requestAnimationFrame(frame);
  };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  const renderStatic = () => {
    const st = opts.still ?? { t: 0.8, rx: 0.12, ry: -0.45, rz: -0.05 };
    build(st.t);
    group.rotation.set(st.rx, st.ry, st.rz ?? -0.05);
    backdropMat.uniforms.uTime.value = st.t * 10;
    renderer.render(scene, camera);
  };

  const ro = new ResizeObserver(() => { resize(); if (!running) renderStatic(); });
  ro.observe(canvas);
  resize();

  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); else stop(); });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  if (opts.reduceMotion || opts.still) renderStatic(); else start();

  return () => { stop(); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onPointer); renderer.dispose(); };
}
