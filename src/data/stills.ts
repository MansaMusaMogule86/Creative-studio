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
  /** No backdrop: an alpha cutout that sits on the page's own light field. */
  transparent?: boolean;
  /** Output widths; defaults to full and half. */
  widths?: number[];
};

// The five division palettes, matching src/data/divisions.ts accents.
export const PALETTES: Record<Division['slug'], Palette> = {
  digital: { lights: ['#7fb4ff', '#5fd6d8', '#d6e2ee'], tint: '#8ee7e8', fields: ['#c4e8ff', '#a8eded', '#e6eef6'] },
  ai: { lights: ['#8c6cf2', '#b9a5ff', '#e4e2f2'], tint: '#9b84ff', fields: ['#cfc2ff', '#e0d8ff', '#efeaff'] },
  growth: { lights: ['#ff9b85', '#ffc6ac', '#f3ddbf'], tint: '#ffb49a', fields: ['#ffd6c2', '#ffe4c8', '#fff1e6'] },
  creative: { lights: ['#ff9fd2', '#d9a8ff', '#ffe0f0'], tint: '#e8b4ff', fields: ['#ffd1ea', '#e8d0ff', '#fff0f6'] },
  strategy: { lights: ['#e9cf98', '#fbf1dc', '#6d6b7a'], tint: '#efdcb4', fields: ['#f3e4c6', '#fbf6ec', '#e3e0e8'] },
};

// One signature angle per division; desktop is square, wide is for tablet/phone.
const DIV_ANGLES: Record<Division['slug'], Pick<Still, 't' | 'rx' | 'ry' | 'rz'>> = {
  digital: { t: 1.6, rx: 0.2, ry: 0.55, rz: 0.08 },
  ai: { t: 3.1, rx: 0.42, ry: -1.05, rz: -0.12 },
  growth: { t: 2.4, rx: -0.1, ry: -0.15, rz: -0.25 },
  creative: { t: 4.4, rx: -0.18, ry: 1.35, rz: 0.2 },
  strategy: { t: 5.6, rx: 0.3, ry: 0.15, rz: 0.04 },
};

const divisionStills: Still[] = (Object.keys(DIV_ANGLES) as Division['slug'][]).flatMap((slug) => [
  { id: `division-${slug}`, width: 1040, height: 1040, fit: 1.05, ...DIV_ANGLES[slug], palette: PALETTES[slug], widths: [1040, 520] },
  { id: `division-${slug}-wide`, width: 1200, height: 760, fit: 1.0, ...DIV_ANGLES[slug], palette: PALETTES[slug], widths: [1200, 600] },
  // Transparent cutout for the homepage division showcase (no baked backdrop or frame).
  { id: `division-${slug}-cut`, width: 1100, height: 900, fit: 1.0, ...DIV_ANGLES[slug], palette: PALETTES[slug], widths: [1100, 550], transparent: true },
]);

export const stills: Still[] = [
  // Hero card: desktop + phone framings of the default (all-division) palette.
  { id: 'hero-card', width: 1320, height: 760, t: 0.8, rx: 0.12, ry: -0.45 },
  { id: 'hero-card-mobile', width: 700, height: 805, t: 0.8, rx: 0.12, ry: -0.45 },
  // Selected-work placeholders (concept renders, labelled as such in the UI).
  { id: 'work-digital', width: 1400, height: 1050, fit: 0.95, ...DIV_ANGLES.digital, palette: PALETTES.digital },
  { id: 'work-ai', width: 1200, height: 1080, fit: 0.9, ...DIV_ANGLES.ai, palette: PALETTES.ai },
  { id: 'work-creative', width: 1200, height: 1080, fit: 0.9, ...DIV_ANGLES.creative, palette: PALETTES.creative },
  { id: 'work-growth', width: 1400, height: 1050, fit: 0.95, ...DIV_ANGLES.growth, palette: PALETTES.growth },
  ...divisionStills,
  // Section background: sculpture parked to the right, behind the contact form.
  { id: 'bg-contact', width: 1800, height: 1100, t: 6.2, rx: 0.28, ry: 0.9, rz: 0.1, fit: 0.72, x: 0.2, y: 0.02, widths: [1800, 900] },
  // Open Graph sharing image (PNG, see render script).
  { id: 'og', width: 1200, height: 630, t: 0.8, rx: 0.12, ry: -0.45, fit: 0.86, x: 0.24, og: true },
];
