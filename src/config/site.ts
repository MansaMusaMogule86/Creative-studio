// Build-time environment flags (read during the static build, never shipped as secrets).
// SITE_ENV=production (default) → indexable. Any other value (e.g. "staging",
// "preview") makes every page noindex and robots.txt disallow everything, so a
// staging copy can never compete with the live site in search results.
export const SITE_ENV = process.env.SITE_ENV ?? 'production';
export const INDEXABLE = SITE_ENV === 'production';
