// Deterministic still renders of the hero sculpture, produced locally by
// scripts/render-stills.mjs (no paid generation). Outputs are optimised WebP
// in public/renders/ (and public/og.png for the sharing image).
import type { Palette } from '../scripts/sculpture';
import type { Division } from './divisions';

export type Still = {
  id: string; width: number; height: number;
  t: number; rx: number; ry: number; rz?: number; fit?: number; x?: number; y?: number;
  palette?: Palette;
  /** Render the Open Graph layout (headline over the sculpture) instead of a bare frame. */
  og?: boolean;
  /** Output widths; defaults to full and half. */
  widths?: number[];
  /** Render a showcase division scene instead of the hero sculpture. */
  scene?: Division['slug'];
};

// The five division palettes, matching src/data/divisions.ts accents.
export const PALETTES: Record<Division['slug'], Palette> = {
  digital: { lights: ['#7fb4ff', '#5fd6d8', '#d6e2ee'], tint: '#8ee7e8', fields: ['#c4e8ff', '#a8eded', '#e6eef6'] },
  ai: { lights: ['#8c6cf2', '#b9a5ff', '#e4e2f2'], tint: '#9b84ff', fields: ['#cfc2ff', '#e0d8ff', '#efeaff'] },
  growth: { lights: ['#ff9b85', '#ffc6ac', '#f3ddbf'], tint: '#ffb49a', fields: ['#ffd6c2', '#ffe4c8', '#fff1e6'] },
  creative: { lights: ['#ff9fd2', '#d9a8ff', '#ffe0f0'], tint: '#e8b4ff', fields: ['#ffd1ea', '#e8d0ff', '#fff0f6'] },
  strategy: { lights: ['#e9cf98', '#fbf1dc', '#6d6b7a'], tint: '#efdcb4', fields: ['#f3e4c6', '#fbf6ec', '#e3e0e8'] },
};


// Showcase sculptures (src/scripts/division-scenes.ts) rendered to stills:
// first paint, and the fallback without live WebGL.
const SLUGS: Division['slug'][] = ['digital', 'ai', 'growth', 'creative', 'strategy'];
const DIV_T: Record<Division['slug'], number> = { digital: 3.0, ai: 4.2, growth: 3.4, creative: 2.6, strategy: 2.2 };
const divisionStills: Still[] = SLUGS.map((slug) => (
  { id: `div3d-${slug}-wide`, width: 1200, height: 760, t: DIV_T[slug], rx: 0, ry: 0, scene: slug, widths: [1200, 600] }
));

export const stills: Still[] = [
  // Hero card: desktop + phone framings of the default (all-division) palette.
  { id: 'hero-card', width: 1320, height: 760, t: 0.8, rx: 0.12, ry: -0.45 },
  { id: 'hero-card-mobile', width: 700, height: 805, t: 0.8, rx: 0.12, ry: -0.45 },
  // Section background: sculpture parked to the right, behind the contact form.
  { id: 'bg-contact', width: 1800, height: 1100, t: 6.2, rx: 0.28, ry: 0.9, rz: 0.1, fit: 0.72, x: 0.2, y: 0.02, widths: [1800, 900] },
  // Open Graph sharing image (PNG, see render script).
  ...divisionStills,
  { id: 'og', width: 1200, height: 630, t: 0.8, rx: 0.12, ry: -0.45, fit: 0.86, x: 0.24, og: true },
];
