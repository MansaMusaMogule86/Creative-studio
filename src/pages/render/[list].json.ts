import { stills } from '../../data/stills';
// Dev-only still list for scripts/render-stills.mjs; emitted only when RENDER_STILLS=1.
export function getStaticPaths() {
  return process.env.RENDER_STILLS ? [{ params: { list: 'stills' } }] : [];
}
export const GET = () => new Response(JSON.stringify(stills), { headers: { 'Content-Type': 'application/json' } });
