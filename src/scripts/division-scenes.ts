// Five procedurally modelled division artworks (glass, iridescence, gold),
// built with three.js only — no external models, so no licensing exposure.
// Each builder returns a scene graph plus an update(t, pointer) function.
// Art direction: docs/creative-3d + the owner's five reference images.
import {
  AdditiveBlending, BackSide, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color,
  ConeGeometry, CylinderGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, IcosahedronGeometry,
  LatheGeometry, Line, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, Object3D, PlaneGeometry, Points,
  PointsMaterial, Scene, ShaderMaterial, Shape, SphereGeometry, SRGBColorSpace, Texture, TorusGeometry, TubeGeometry,
  Vector2, Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type DivisionSlug = 'digital' | 'ai' | 'growth' | 'creative' | 'strategy';
export type Pointer = { x: number; y: number }; // -1..1
export type DivisionArt = { root: Group; update: (t: number, dt: number, p: Pointer) => void; env: EnvSpec; fields: [string, string, string]; cameraZ: number };
export type EnvSpec = { base: string; lights: [string, string, string]; accents: string[] };

// ───────── Materials ─────────
export const glass = (tint: string, o: Partial<{ iridescence: number; roughness: number; thickness: number; attenuation: number; opacity: number; inner: number }> = {}) =>
  new MeshPhysicalMaterial({
    color: '#ffffff', metalness: 0, roughness: o.roughness ?? 0.04,
    transmission: 1, thickness: o.thickness ?? 0.8, ior: 1.46,
    iridescence: o.iridescence ?? 0.9, iridescenceIOR: 1.6, iridescenceThicknessRange: [220, 900],
    clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 1, envMapIntensity: 1.25,
    attenuationColor: new Color(tint), attenuationDistance: (o.attenuation ?? 1.8) * 0.8,
    transparent: o.opacity !== undefined, opacity: o.opacity ?? 1,
    // Faint internal glow keeps tinted glass rich against light backdrops.
    emissive: new Color(tint), emissiveIntensity: o.inner ?? 0,
  });
export const gold = (rough = 0.18) => new MeshPhysicalMaterial({ color: '#d9ab45', metalness: 1, roughness: rough, clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 1.5 });
export const chrome = () => new MeshPhysicalMaterial({ color: '#e8e9f2', metalness: 1, roughness: 0.12, envMapIntensity: 1.4 });
export const glow = (color: string, opacity = 0.9, through = false) => new MeshBasicMaterial({ color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, depthTest: !through, toneMapped: false });

// Soft neon edge: a fresnel shell drawn additively over a glass mesh.
export function edge<T extends Mesh>(mesh: T, color: string, intensity = 1, power = 2.6): T {
  const mat = new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color) }, uI: { value: intensity }, uP: { value: power } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uI; uniform float uP; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uP); gl_FragColor = vec4(uColor * f * uI, f * uI); }`,
    transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false,
  });
  const shell = new Mesh(mesh.geometry, mat);
  shell.renderOrder = 2;
  mesh.add(shell);
  return mesh;
}

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): Texture => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  return t;
};
const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// Glass podium with a luminous rim, shared by every artwork (as in the references).
function podium(accent: string, tint: string) {
  const g = new Group();
  const disc = new Mesh(new CylinderGeometry(1.75, 1.85, 0.16, 128, 1), glass(tint, { iridescence: 0.6, thickness: 0.6, attenuation: 0.8 }));
  const top = new Mesh(new CylinderGeometry(1.3, 1.3, 0.05, 128, 1), new MeshPhysicalMaterial({ color: new Color(tint).lerp(new Color('#ffffff'), 0.55), roughness: 0.18, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.6, envMapIntensity: 1.2 }));
  top.position.y = 0.12;
  const rim = new Mesh(new TorusGeometry(1.78, 0.014, 8, 220), glow(accent, 1));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.06;
  const rim2 = new Mesh(new TorusGeometry(1.31, 0.009, 8, 200), glow(accent, 0.8));
  rim2.rotation.x = Math.PI / 2; rim2.position.y = 0.15;
  edge(disc, accent, 0.55);
  g.add(disc, top, rim, rim2);
  g.position.y = -1.55;
  return g;
}

// An orbit ring with a bead travelling along it.
function orbit(radius: number, color: string, beadMat: Material, tube = 0.012) {
  const g = new Group();
  const ring = new Mesh(new TorusGeometry(radius, tube, 10, 260), glow(color, 0.75));
  const bead = new Mesh(new SphereGeometry(0.07, 24, 16), beadMat);
  g.add(ring, bead);
  return { g, place: (a: number) => bead.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0) };
}

// Pulses travelling along polylines (neural pathways, arrows): 'u' runs 0..1 along each line.
function pulseMaterial(color: string, speed = 0.35, width = 0.08) {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new Color(color) }, uSpeed: { value: speed }, uWidth: { value: width } },
    vertexShader: `uniform float uSeed; varying float vU; varying float vSeed; void main(){ vU = uv.x; vSeed = uSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uSpeed; uniform float uWidth; varying float vU; varying float vSeed;
      void main(){ float head = fract(uTime*uSpeed + vSeed); float d = abs(vU - head); float p = smoothstep(uWidth, 0.0, d);
      gl_FragColor = vec4(uColor * (0.25 + 2.2*p), 0.35 + 0.65*p); }`,
    transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending, toneMapped: false,
  });
}
// A thin glowing tube along a path; the pulse position comes from the tube's
// uv.x (0..1 along its length) plus a per-path seed.
function pulseLine(points: Vector3[], mat: ShaderMaterial, seed: number, radius = 0.006) {
  const m = mat.clone();
  m.uniforms = { ...mat.uniforms, uSeed: { value: seed } };
  const tube = new Mesh(new TubeGeometry(new CatmullRomCurve3(points), Math.max(16, points.length), radius, 5, false), m);
  tube.userData.pulse = m;
  return tube;
}

// ───────── 01 Digital: holographic laptop, dotted globe, orbits ─────────
function digital(): DivisionArt {
  const root = new Group();
  const tint = '#9fdcff';
  root.add(podium('#7fe3ff', tint));

  const laptop = new Group();
  const base = edge(new Mesh(new RoundedBoxGeometry(2.3, 0.08, 1.5, 4, 0.05), glass(tint, { roughness: 0.08, iridescence: 0.5 })), '#8fe9ff', 0.9);
  const keys = new Mesh(new PlaneGeometry(1.9, 0.75), new MeshBasicMaterial({
    map: canvasTex(512, 200, (g) => { g.clearRect(0, 0, 512, 200); g.fillStyle = 'rgba(210,235,255,0.55)'; for (let r = 0; r < 4; r++) for (let c = 0; c < 13; c++) { rr(g, 8 + c * 38.5, 10 + r * 46, 33, 38, 6); g.fill(); } }),
    transparent: true, opacity: 0.7, depthWrite: false,
  }));
  keys.rotation.x = -Math.PI / 2; keys.position.set(0, 0.045, -0.15);
  const pad = new Mesh(new PlaneGeometry(0.7, 0.35), glow('#bfe8ff', 0.18)); pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.046, 0.48);
  const hinge = new Group(); hinge.position.set(0, 0.04, -0.72); hinge.rotation.x = -0.32;
  const screen = edge(new Mesh(new RoundedBoxGeometry(2.3, 1.45, 0.05, 4, 0.04), glass(tint, { roughness: 0.05 })), '#a9c8ff', 0.9);
  screen.position.y = 0.72;
  const ui = new Mesh(new PlaneGeometry(2.1, 1.28), new MeshBasicMaterial({
    map: canvasTex(840, 512, (g) => {
      const gr = g.createLinearGradient(0, 0, 840, 512); gr.addColorStop(0, 'rgba(60,40,170,0.85)'); gr.addColorStop(0.55, 'rgba(70,120,240,0.75)'); gr.addColorStop(1, 'rgba(110,220,255,0.7)');
      g.fillStyle = gr; rr(g, 0, 0, 840, 512, 26); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.85)'; [[40, 40, 140, 14], [40, 70, 90, 10]].forEach(([x, y, w, h]) => { rr(g, x, y, w, h, 6); g.fill(); });
      g.fillStyle = 'rgba(255,255,255,0.22)'; rr(g, 40, 120, 470, 330, 18); g.fill(); rr(g, 540, 120, 260, 150, 18); g.fill(); rr(g, 540, 300, 260, 150, 18); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 6; g.beginPath(); [[70, 400], [170, 330], [260, 360], [360, 250], [470, 200]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.85)'; [0, 1, 2, 3].forEach((i) => { const h = 30 + i * 22; rr(g, 580 + i * 50, 250 - h, 30, h, 6); g.fill(); });
      g.font = 'bold 64px monospace'; g.fillText('</>', 600, 400);
    }),
    transparent: true, toneMapped: false, depthWrite: false,
  }));
  ui.position.set(0, 0.72, 0.035);
  hinge.add(screen, ui);
  laptop.add(base, keys, pad, hinge);
  laptop.position.set(0.25, -0.75, 0.2); laptop.rotation.set(0.18, -0.45, 0);
  root.add(laptop);

  // Dotted globe: glass sphere + land-like dot pattern + graticule.
  const globe = new Group();
  globe.add(edge(new Mesh(new SphereGeometry(0.95, 64, 48), glass('#7fb4ff', { iridescence: 0.5, thickness: 0.5, attenuation: 3 })), '#7fe3ff', 1.3, 2.2));
  const pts: number[] = [];
  const N = 2600;
  for (let i = 0; i < N; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / N), th = Math.PI * (1 + Math.sqrt(5)) * i;
    const lat = Math.PI / 2 - phi, lon = (th % (Math.PI * 2)) - Math.PI;
    // Procedural "continents": smooth trigonometric field, deterministic.
    const f = Math.sin(lon * 2.1 + 0.6) * Math.cos(lat * 2.6) + 0.55 * Math.sin(lon * 4.3 - lat * 3.1) + 0.35 * Math.cos(lat * 5.0 + lon);
    if (f > 0.35 && Math.abs(lat) < 1.3) pts.push(0.965 * Math.cos(lat) * Math.cos(lon), 0.965 * Math.sin(lat), 0.965 * Math.cos(lat) * Math.sin(lon));
  }
  const dotGeo = new BufferGeometry(); dotGeo.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
  globe.add(new Points(dotGeo, new PointsMaterial({ color: '#e6fbff', size: 0.028, transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false, toneMapped: false })));
  for (let k = -2; k <= 2; k++) { const r = 0.97 * Math.cos((k * Math.PI) / 7); const m = new Mesh(new TorusGeometry(r, 0.003, 6, 120), glow('#bdefff', 0.35)); m.rotation.x = Math.PI / 2; m.position.y = 0.97 * Math.sin((k * Math.PI) / 7); globe.add(m); }
  for (let k = 0; k < 6; k++) { const m = new Mesh(new TorusGeometry(0.97, 0.003, 6, 120), glow('#bdefff', 0.3)); m.rotation.y = (k * Math.PI) / 6; globe.add(m); }
  globe.position.set(-0.75, 0.75, -0.35);
  root.add(globe);

  // Floating glass UI cards.
  const cardTex = (kind: 0 | 1 | 2) => canvasTex(256, 170, (g) => {
    g.fillStyle = 'rgba(170,215,255,0.35)'; rr(g, 0, 0, 256, 170, 26); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.fillStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 9; g.lineCap = 'round';
    if (kind === 0) { g.font = 'bold 84px monospace'; g.fillText('</>', 38, 115); }
    if (kind === 1) [0, 1, 2, 3].forEach((i) => { const h = 30 + i * 22; rr(g, 50 + i * 42, 130 - h, 26, h, 5); g.fill(); });
    if (kind === 2) { g.beginPath(); [[40, 120], [100, 90], [150, 105], [215, 50]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
  });
  const cards = [0, 1, 2].map((k) => {
    const c = new Group();
    c.add(new Mesh(new RoundedBoxGeometry(0.62, 0.42, 0.03, 3, 0.04), glass('#bfe3ff', { thickness: 0.1, iridescence: 0.4 })));
    const f = new Mesh(new PlaneGeometry(0.56, 0.37), new MeshBasicMaterial({ map: cardTex(k as 0 | 1 | 2), transparent: true, toneMapped: false, depthWrite: false }));
    f.position.z = 0.02; c.add(f);
    c.position.set(1.35 + (k === 0 ? 0.05 : 0.25), 0.95 - k * 0.55, 0.3 + k * 0.1); c.rotation.y = -0.5;
    root.add(c); return c;
  });

  const o1 = orbit(2.05, '#bff4ff', chrome()); o1.g.rotation.set(1.25, 0.25, 0.1); root.add(o1.g);
  const o2 = orbit(1.55, '#c9b8ff', glow('#ffffff', 1)); o2.g.rotation.set(1.05, -0.5, 0.4); o2.g.position.set(-0.75, 0.75, -0.35); root.add(o2.g);

  return {
    root, cameraZ: 8.1,
    env: { base: '#eef3ff', lights: ['#7fd8ff', '#a58cff', '#d6e2ee'], accents: ['#5fd6d8'] },
    fields: ['#c4e2ff', '#d9ccff', '#bff3f5'],
    update: (t, _dt, p) => {
      laptop.position.y = -0.75 + Math.sin(t * 0.9) * 0.06;
      globe.rotation.y = t * 0.25;
      o1.g.rotation.z = t * 0.12; o1.place(t * 0.6);
      o2.g.rotation.z = -t * 0.18; o2.place(-t * 0.9 + 1);
      cards.forEach((c, i) => { c.position.y = 0.95 - i * 0.55 + Math.sin(t * 1.1 + i * 1.7) * 0.05; });
      root.rotation.y = -0.15 + p.x * 0.18 + Math.sin(t * 0.2) * 0.08;
      root.rotation.x = p.y * 0.06;
    },
  };
}

// ───────── 02 AI: glass intelligence sculpture with neural light ─────────
function ai(): DivisionArt {
  const root = new Group();
  const tint = '#b49bff';
  root.add(podium('#a78bff', tint));
  const bust = new Group();
  // Head-and-neck silhouette as a lathe (abstract, faceless bust).
  const prof: Vector2[] = [];
  const pts = [[0, -1.42], [0.62, -1.42], [0.7, -1.3], [0.52, -1.05], [0.36, -0.7], [0.34, -0.45], [0.48, -0.25], [0.74, 0.05], [0.86, 0.45], [0.84, 0.85], [0.7, 1.2], [0.45, 1.42], [0.2, 1.52], [0, 1.54]];
  for (const [x, y] of pts) prof.push(new Vector2(x, y));
  const shell = new Mesh(new LatheGeometry(new CatmullRomCurve3(prof.map((v) => new Vector3(v.x, v.y, 0))).getPoints(80).map((v) => new Vector2(v.x, v.y)), 96), glass(tint, { iridescence: 0.9, thickness: 1.2, attenuation: 1.6 }));
  shell.scale.set(1, 1, 0.92);
  edge(shell, '#b9a2ff', 1.3, 2.2);
  bust.add(shell);
  // Inner luminous core.
  const core = new Mesh(new IcosahedronGeometry(0.42, 4), glow('#b89cff', 0.35, true)); core.position.y = 0.6; bust.add(core);
  // Neural pathways: curves inside the cranium with travelling pulses.
  const pm = pulseMaterial('#c7a8ff', 0.28, 0.07);
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const inside = () => { const a = rnd() * Math.PI * 2, b = rnd() * Math.PI, r = 0.15 + rnd() * 0.55; return new Vector3(Math.cos(a) * Math.sin(b) * r, 0.62 + Math.cos(b) * r * 0.95, Math.sin(a) * Math.sin(b) * r * 0.85); };
  const nodes: Vector3[] = [];
  for (let i = 0; i < 46; i++) {
    const a = inside(), b = inside(), m = a.clone().lerp(b, 0.5).add(new Vector3((rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3));
    bust.add(pulseLine(new CatmullRomCurve3([a, m, b]).getPoints(40), pm, rnd()));
    nodes.push(a, b);
  }
  // Spine pathway down the neck.
  for (let k = 0; k < 6; k++) bust.add(pulseLine(new CatmullRomCurve3([new Vector3((k - 2.5) * 0.05, 0.25, 0), new Vector3((k - 2.5) * 0.04, -0.4, 0.05), new Vector3((k - 2.5) * 0.08, -1.2, 0)]).getPoints(40), pm, k / 6));
  const nodeGeo = new BufferGeometry().setFromPoints(nodes);
  const nodeMat = new PointsMaterial({ color: '#ffffff', size: 0.05, transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false });
  bust.add(new Points(nodeGeo, nodeMat));
  root.add(bust);

  // Processor chip with pins.
  const chip = new Group();
  chip.add(edge(new Mesh(new RoundedBoxGeometry(0.8, 0.8, 0.1, 3, 0.05), glass('#9a84ff', { iridescence: 0.6, thickness: 0.2 })), '#c9b8ff', 1));
  const face = new Mesh(new PlaneGeometry(0.62, 0.62), new MeshBasicMaterial({ map: canvasTex(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 140); gr.addColorStop(0, 'rgba(190,160,255,0.95)'); gr.addColorStop(1, 'rgba(110,80,230,0.6)');
    g.fillStyle = gr; rr(g, 0, 0, 256, 256, 28); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(20 + i * 40, 20); g.lineTo(20 + i * 40, 60); g.lineTo(60 + i * 30, 90); g.stroke(); }
    g.fillStyle = '#ffffff'; g.font = 'bold 92px sans-serif'; g.textAlign = 'center'; g.fillText('AI', 128, 165);
  }), transparent: true, toneMapped: false, depthWrite: false }));
  face.position.z = 0.056; chip.add(face);
  const pinGeo = new BoxGeometry(0.035, 0.12, 0.02);
  for (let i = 0; i < 7; i++) for (const [x, y, rz] of [[-0.3 + i * 0.1, 0.46, 0], [-0.3 + i * 0.1, -0.46, 0], [0.46, -0.3 + i * 0.1, Math.PI / 2], [-0.46, -0.3 + i * 0.1, Math.PI / 2]]) { const pin = new Mesh(pinGeo, chrome()); pin.position.set(x, y, 0); pin.rotation.z = rz; chip.add(pin); }
  chip.position.set(1.25, -0.2, 0.55); chip.rotation.set(0.1, -0.55, 0.05);
  root.add(chip);

  const o1 = orbit(1.8, '#cbb8ff', glow('#ffffff', 1)); o1.g.rotation.set(1.3, 0.3, 0.2); o1.g.position.y = 0.3; root.add(o1.g);
  return {
    root, cameraZ: 8.2,
    env: { base: '#f0ecff', lights: ['#8c6cf2', '#6f8cff', '#e4e2f2'], accents: ['#b9a5ff'] },
    fields: ['#cfc2ff', '#b9c8ff', '#efeaff'],
    update: (t, _dt, p) => {
      pm.uniforms.uTime.value = t;
      nodeMat.size = 0.045 + Math.sin(t * 2.2) * 0.012;
      (core.material as MeshBasicMaterial).opacity = 0.28 + Math.sin(t * 1.6) * 0.1;
      bust.rotation.y = -0.6 + Math.sin(t * 0.25) * 0.35 + p.x * 0.2;
      chip.position.y = -0.2 + Math.sin(t * 0.9) * 0.06;
      o1.g.rotation.z = t * 0.2; o1.place(t * 0.8);
      root.rotation.x = p.y * 0.05;
    },
  };
}

// ───────── 03 Growth: glass revenue columns + ascending arrow ─────────
function growth(): DivisionArt {
  const root = new Group();
  const tint = '#ffb39a';
  root.add(podium('#ffb08f', tint));
  const heights = [0.35, 0.65, 1.0, 1.45, 2.0];
  const cols = heights.map((h, i) => {
    const m = new Mesh(new RoundedBoxGeometry(0.48, h, 0.48, 4, 0.05), glass(i % 2 ? '#ff7f9c' : '#ff9a62', { iridescence: 1, thickness: 1.0, attenuation: 1.5, inner: 0.22 }));
    m.geometry.translate(0, h / 2, 0);
    edge(m, '#ffc2a0', 1.1, 2.2);
    m.position.set(-1.25 + i * 0.62, -1.33, 0.35 - i * 0.22);
    root.add(m); return m;
  });
  // Arrow: tube along a rising curve, revealed progressively, with a faceted head.
  const curve = new CatmullRomCurve3([new Vector3(-1.75, -1.0, 0.7), new Vector3(-0.8, -0.65, 0.5), new Vector3(0.1, 0.0, 0.2), new Vector3(0.9, 0.75, -0.1), new Vector3(1.45, 1.35, -0.35)]);
  const tubeGeo = new TubeGeometry(curve, 240, 0.055, 18, false);
  const arrowMat = new MeshPhysicalMaterial({ color: '#f3c27a', metalness: 0.85, roughness: 0.14, clearcoat: 1, emissive: new Color('#ff7a45'), emissiveIntensity: 0.7, envMapIntensity: 1.4 });
  const tube = new Mesh(tubeGeo, arrowMat);
  const full = tubeGeo.index!.count;
  const head = new Mesh(new ConeGeometry(0.2, 0.46, 3, 1), glass('#ffc2a0', { iridescence: 0.9, thickness: 0.4 }));
  root.add(tube, head);
  const trail = new Mesh(new TubeGeometry(curve, 240, 0.12, 12, false), glow('#ffb38a', 0.18));
  root.add(trail);
  return {
    root, cameraZ: 8.0,
    env: { base: '#fff4ef', lights: ['#ff9b85', '#ffc6ac', '#f3ddbf'], accents: ['#ffd27a'] },
    fields: ['#ffd6c2', '#ffd0dc', '#fff1e6'],
    update: (t, _dt, p) => {
      // Driven by scene time so a still render at t≥2.4 shows the finished state.
      const grown = Math.min(1, t / 2.4);
      const e = 1 - Math.pow(1 - grown, 3);
      cols.forEach((c, i) => { const k = Math.min(1, Math.max(0, (e * 1.4 - i * 0.08))); c.scale.y = Math.max(0.001, k) * (1 + Math.sin(t * 1.2 + i) * 0.012); });
      const draw = Math.max(0.02, Math.min(1, (e - 0.25) / 0.75));
      tube.geometry.setDrawRange(0, Math.floor((full * draw) / 6) * 6);
      trail.geometry.setDrawRange(0, Math.floor((trail.geometry.index!.count * draw) / 6) * 6);
      const u = Math.min(0.999, draw);
      const pos = curve.getPointAt(u), tan = curve.getTangentAt(u);
      head.position.copy(pos);
      head.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), tan);
      arrowMat.emissiveIntensity = 0.45 + 0.25 * Math.sin(t * 2);
      root.rotation.y = -0.25 + p.x * 0.22 + Math.sin(t * 0.18) * 0.06;
      root.rotation.x = p.y * 0.05;
    },
  };
}

// ───────── 04 Creative: iridescent glass M with orbital ribbons ─────────
function creative(): DivisionArt {
  const root = new Group();
  const tint = '#f0a6ff';
  root.add(podium('#ff8fd8', tint));
  // A sculptural M (artwork, not the crowned-M emblem): two pillars and a deep V.
  const s = new Shape();
  s.moveTo(-1.05, -1.2); s.lineTo(-1.05, 1.2); s.lineTo(-0.62, 1.2); s.lineTo(0, 0.25); s.lineTo(0.62, 1.2); s.lineTo(1.05, 1.2);
  s.lineTo(1.05, -1.2); s.lineTo(0.68, -1.2); s.lineTo(0.68, 0.45); s.lineTo(0.08, -0.48); s.lineTo(-0.08, -0.48); s.lineTo(-0.68, 0.45); s.lineTo(-0.68, -1.2); s.lineTo(-1.05, -1.2);
  const mGeo = new ExtrudeGeometry(s, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 6, curveSegments: 8 });
  mGeo.center();
  const M = edge(new Mesh(mGeo, glass('#e07cff', { iridescence: 1, thickness: 1.4, attenuation: 1.6, inner: 0.2 })), '#ff9fe6', 1.1, 2.2);
  const mGroup = new Group(); mGroup.add(M); mGroup.position.y = -0.05;
  root.add(mGroup);
  // Ribbons: flattened glass tori orbiting at different tilts.
  const ribbon = (r: number, col: string) => { const m = edge(new Mesh(new TorusGeometry(r, 0.07, 18, 260), glass(col, { iridescence: 1, thickness: 0.25, attenuation: 0.8, inner: 0.15 })), col, 1.2, 2); m.scale.z = 0.18; return m; };
  const r1 = ribbon(2.0, '#ffb3ec'), r2 = ribbon(1.7, '#a8d8ff');
  const r1g = new Group(), r2g = new Group(); r1g.add(r1); r2g.add(r2);
  r1g.rotation.set(1.2, 0.35, 0); r2g.rotation.set(1.85, -0.5, 0.3);
  root.add(r1g, r2g);
  // Fanned colour-swatch cards (creative tooling, abstracted).
  const swatches = ['#ffd1ea', '#f7a8e0', '#d78cf2', '#b99cff', '#ffc6ac'].map((c, i) => {
    const m = new Mesh(new RoundedBoxGeometry(0.22, 0.75, 0.03, 2, 0.03), glass(c, { iridescence: 0.6, thickness: 0.15, attenuation: 0.8, inner: 0.35 }));
    m.geometry.translate(0, 0.37, 0);
    m.position.set(1.35, -1.25, 0.3); m.rotation.set(0, -0.4, -0.75 + i * 0.25); root.add(m); return m;
  });
  return {
    root, cameraZ: 7.9,
    env: { base: '#fbefff', lights: ['#ff9fd2', '#d9a8ff', '#8ee7e8'], accents: ['#ffe0f0'] },
    fields: ['#ffd1ea', '#e8d0ff', '#d4f3ff'],
    update: (t, _dt, p) => {
      mGroup.rotation.y = Math.sin(t * 0.3) * 0.55 + p.x * 0.25;
      mGroup.position.y = -0.05 + Math.sin(t * 0.8) * 0.05;
      r1g.rotation.z = t * 0.16; r2g.rotation.z = -t * 0.12;
      r1.rotation.y = Math.sin(t * 0.7) * 0.06;
      swatches.forEach((m, i) => { m.rotation.z = -0.75 + i * 0.25 + Math.sin(t * 0.8 + i * 0.5) * 0.03; });
      root.rotation.x = p.y * 0.05;
    },
  };
}

// ───────── 05 Strategy: crystal chess king with gold crown and orbit ─────────
function strategy(): DivisionArt {
  const root = new Group();
  const tint = '#f3dfb3';
  root.add(podium('#e6c27a', tint));
  const prof = [[0, -1.38], [0.85, -1.38], [0.88, -1.25], [0.72, -1.15], [0.76, -1.05], [0.55, -0.95], [0.42, -0.6], [0.32, 0.05], [0.3, 0.45], [0.48, 0.52], [0.5, 0.6], [0.36, 0.66], [0.42, 0.95], [0.55, 1.1], [0.5, 1.18], [0, 1.2]];
  const pts = new CatmullRomCurve3(prof.map(([x, y]) => new Vector3(x, y, 0)), false, 'centripetal').getPoints(120).map((v) => new Vector2(Math.max(0, v.x), v.y));
  const king = new Group();
  king.add(edge(new Mesh(new LatheGeometry(pts, 128), glass('#fff1d6', { iridescence: 0.5, thickness: 1.8, attenuation: 5 })), '#f5d58f', 1.1, 2.2));
  // Gold crown: band, points, finial cross.
  const crown = new Group();
  const band = new Mesh(new CylinderGeometry(0.52, 0.46, 0.18, 64, 1, true), gold()); band.material.side = DoubleSide;
  crown.add(band);
  const rim = new Mesh(new TorusGeometry(0.5, 0.03, 12, 96), gold()); rim.rotation.x = Math.PI / 2; rim.position.y = -0.09; crown.add(rim);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spike = new Mesh(new ConeGeometry(0.07, 0.26, 12), gold()); spike.position.set(Math.cos(a) * 0.49, 0.2, Math.sin(a) * 0.49); crown.add(spike);
    const ball = new Mesh(new SphereGeometry(0.045, 16, 12), gold(0.1)); ball.position.set(Math.cos(a) * 0.49, 0.35, Math.sin(a) * 0.49); crown.add(ball);
  }
  const cross1 = new Mesh(new BoxGeometry(0.07, 0.36, 0.07), gold()); cross1.position.y = 0.42;
  const cross2 = new Mesh(new BoxGeometry(0.24, 0.07, 0.07), gold()); cross2.position.y = 0.46;
  crown.add(cross1, cross2);
  crown.position.y = 1.28;
  king.add(crown);
  // Gold collar ring.
  const collar = new Mesh(new TorusGeometry(0.49, 0.025, 12, 96), gold()); collar.rotation.x = Math.PI / 2; collar.position.y = 0.56; king.add(collar);
  root.add(king);
  // A pawn in the background for depth.
  const pawnProf = [[0, -1.38], [0.5, -1.38], [0.48, -1.2], [0.3, -1.0], [0.18, -0.4], [0.32, -0.3], [0.2, -0.2], [0.3, 0.05], [0.28, 0.3], [0.12, 0.42], [0, 0.44]];
  const pawn = new Mesh(new LatheGeometry(new CatmullRomCurve3(pawnProf.map(([x, y]) => new Vector3(x, y, 0))).getPoints(60).map((v) => new Vector2(Math.max(0, v.x), v.y)), 64), glass('#ffffff', { iridescence: 0.3, thickness: 0.8, roughness: 0.12, attenuation: 5 }));
  edge(pawn, '#ffffff', 0.6, 2.4);
  pawn.position.set(-1.25, 0.02, -0.9); pawn.scale.setScalar(0.78);
  root.add(pawn);
  // Strategic orbit with gold beads and a floating tactics card.
  const o = orbit(1.85, '#f5d58f', gold(0.1), 0.01); o.g.rotation.set(1.3, -0.2, 0.25); root.add(o.g);
  const card = new Group();
  card.add(new Mesh(new RoundedBoxGeometry(0.9, 0.64, 0.04, 3, 0.05), glass('#fff4dc', { iridescence: 0.3, thickness: 0.1 })));
  const plan = new Mesh(new PlaneGeometry(0.82, 0.56), new MeshBasicMaterial({ map: canvasTex(360, 250, (g) => {
    g.strokeStyle = 'rgba(214,164,59,0.95)'; g.lineWidth = 7; g.lineCap = 'round';
    const X = (x: number, y: number) => { g.beginPath(); g.moveTo(x - 16, y - 16); g.lineTo(x + 16, y + 16); g.moveTo(x + 16, y - 16); g.lineTo(x - 16, y + 16); g.stroke(); };
    X(90, 60); X(250, 50); g.beginPath(); g.arc(90, 190, 18, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(230, 190, 18, 0, Math.PI * 2); g.stroke();
    g.setLineDash([10, 12]); g.beginPath(); g.moveTo(90, 80); g.lineTo(160, 130); g.lineTo(290, 110); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(290, 110); g.lineTo(268, 98); g.moveTo(290, 110); g.lineTo(272, 128); g.stroke();
  }), transparent: true, toneMapped: false, depthWrite: false }));
  plan.position.z = 0.025; card.add(plan);
  card.position.set(1.45, 0.35, 0.3); card.rotation.set(0.05, -0.55, -0.1);
  root.add(card);
  return {
    root, cameraZ: 8.1,
    env: { base: '#fbf6ec', lights: ['#e9cf98', '#fbf1dc', '#c8cad6'], accents: ['#ffd27a', '#ffffff'] },
    fields: ['#f3e4c6', '#fbf6ec', '#e7e2ea'],
    update: (t, _dt, p) => {
      king.rotation.y = t * 0.22;
      o.g.rotation.z = t * 0.1; o.place(t * 0.55);
      card.position.y = 0.35 + Math.sin(t * 0.9) * 0.05;
      root.rotation.y = -0.1 + p.x * 0.15;
      root.rotation.x = p.y * 0.04;
    },
  };
}

export const BUILDERS: Record<DivisionSlug, () => DivisionArt> = { digital, ai, growth, creative, strategy };

// Free GPU memory for everything under a node.
export function disposeTree(o: Object3D) {
  o.traverse((n) => {
    const m = n as Mesh;
    m.geometry?.dispose?.();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats) {
      for (const v of Object.values(mat)) if (v && (v as Texture).isTexture) (v as Texture).dispose();
      mat.dispose();
    }
  });
}

export const envScene = (spec: EnvSpec) => {
  const env = new Scene();
  env.add(new Mesh(new SphereGeometry(20, 32, 16), new MeshBasicMaterial({ color: new Color(spec.base).multiplyScalar(0.85), side: BackSide })));
  const card = (color: string, pos: [number, number, number], s: [number, number], i = 1) => {
    const m = new Mesh(new PlaneGeometry(...s), new MeshBasicMaterial({ color: new Color(color).multiplyScalar(i), side: DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
  };
  card(spec.lights[0], [-9, 4, 4], [8, 12], 2.6);
  card(spec.lights[1], [9, -2, 5], [7, 11], 2.4);
  card(spec.lights[2], [2, -9, 3], [12, 5], 2.2);
  card(spec.lights[0], [6, -6, -8], [8, 8], 2.0);
  card(spec.lights[1], [-8, -4, -6], [6, 8], 2.0);
  card('#ffffff', [0, 9, 6], [12, 3], 3.4);
  card('#ffffff', [4, 2, 10], [3, 8], 2.8);
  spec.accents.forEach((c, k) => card(c, [-6 + k * 12, -5, -6], [4, 6], 1.8));
  card('#f5e5ba', [7, 8, 3], [2.2, 9], 2.2); // champagne highlight shared by all divisions
  card('#25243c', [-6, 0, 8], [1.2, 14], 1);
  card('#25243c', [10, 3, -2], [1, 12], 1);
  card('#3a3460', [0, -10, -4], [14, 1.2], 1);
  return env;
};
