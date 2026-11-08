// Shared capability check for live WebGL. Software rasterisers (SwiftShader,
// llvmpipe…) render glass on the CPU and block the main thread, so those
// devices keep pre-rendered stills. `?force-webgl` overrides for QA/review.
let cached: boolean | null = null;
export function liveWebGL(): boolean {
  if (cached !== null) return cached;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return (cached = false);
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    if (new URLSearchParams(location.search).has('force-webgl')) return (cached = true);
    return (cached = !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer));
  } catch {
    return (cached = false);
  }
}
export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isSmallScreen = () => matchMedia('(max-width: 767px), (pointer: coarse)').matches;
