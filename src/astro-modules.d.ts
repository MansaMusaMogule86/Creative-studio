// Plain `tsc` (pnpm lint) does not understand .astro files; Astro's own
// tooling does. Lucide's Astro icons import Icon.astro from .ts, so declare
// the module shape here for the strict type check.
declare module '*.astro' {
  const Component: (props: Record<string, unknown>) => unknown;
  export default Component;
}
