// Deterministic still renders of the hero sculpture, produced locally by
// scripts/render-stills.mjs (no paid generation). Each output is an
// optimised WebP in public/renders/.
import type { Palette } from '../scripts/sculpture';

export type Still = { id: string; width: number; height: number; t: number; rx: number; ry: number; rz?: number; fit?: number; palette?: Palette };

const P = {
  digital: { lights: ['#7fb4ff', '#5fd6d8', '#d6e2ee'], tint: '#8ee7e8', fields: ['#c4e8ff', '#a8eded', '#e6eef6'] },
  ai: { lights: ['#8c6cf2', '#b9a5ff', '#e4e2f2'], tint: '#9b84ff', fields: ['#cfc2ff', '#e0d8ff', '#efeaff'] },
  creative: { lights: ['#ff9fd2', '#d9a8ff', '#ffe0f0'], tint: '#e8b4ff', fields: ['#ffd1ea', '#e8d0ff', '#fff0f6'] },
  growth: { lights: ['#ff9b85', '#ffc6ac', '#f3ddbf'], tint: '#ffb49a', fields: ['#ffd6c2', '#ffe4c8', '#fff1e6'] },
} satisfies Record<string, Palette>;

export const stills: Still[] = [
  { id: 'hero-card', width: 1320, height: 760, t: 0.8, rx: 0.12, ry: -0.45 },
  { id: 'hero-card-mobile', width: 700, height: 805, t: 0.8, rx: 0.12, ry: -0.45 },
  { id: 'work-digital', width: 1400, height: 1050, t: 1.6, rx: 0.2, ry: 0.55, rz: 0.08, fit: 0.95, palette: P.digital },
  { id: 'work-ai', width: 1200, height: 1080, t: 3.1, rx: 0.42, ry: -1.05, rz: -0.12, fit: 0.9, palette: P.ai },
  { id: 'work-creative', width: 1200, height: 1080, t: 4.4, rx: -0.18, ry: 1.35, rz: 0.2, fit: 0.9, palette: P.creative },
  { id: 'work-growth', width: 1400, height: 1050, t: 2.4, rx: -0.1, ry: -0.15, rz: -0.25, fit: 0.95, palette: P.growth },
];
