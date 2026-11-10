// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// The production domain is not decided yet. Set SITE_URL before a real build;
// canonical URLs, Open Graph URLs and the sitemap are derived from it.
const site = process.env.SITE_URL ?? 'http://localhost:4321';
const SITE_ENV = process.env.SITE_ENV ?? 'production';
if (!process.env.SITE_URL && process.argv.includes('build')) {
  console.warn('\n[mansas] WARNING: SITE_URL is not set. Canonical, Open Graph and sitemap URLs will point to http://localhost:4321.\n         Set SITE_URL (and SITE_ENV=staging for non-production builds) before any real deployment.\n');
}
// Sitemap lists only canonical, indexable pages.
const NOT_IN_SITEMAP = ['/brand', '/legal/', '/404', '/render/'];

export default defineConfig({
  site,
  integrations: [react(), ...(SITE_ENV === 'production' ? [sitemap({ filter: (page) => !NOT_IN_SITEMAP.some((p) => page.includes(p)) })] : [])],
  i18n: {
    // English ships first. fr, ar (RTL) and zh are prepared in src/i18n but
    // have no routes until translations are supplied and approved.
    defaultLocale: 'en',
    locales: ['en', 'fr', 'ar', 'zh'],
    routing: { prefixDefaultLocale: false },
  },
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
