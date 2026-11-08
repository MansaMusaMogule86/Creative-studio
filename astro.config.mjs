// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// The production domain is not decided yet. Set SITE_URL before a real build;
// canonical URLs, Open Graph URLs and the sitemap are derived from it.
const site = process.env.SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  site,
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/brand') })],
  i18n: {
    // English ships first. fr, ar (RTL) and zh are prepared in src/i18n but
    // have no routes until translations are supplied and approved.
    defaultLocale: 'en',
    locales: ['en', 'fr', 'ar', 'zh'],
    routing: { prefixDefaultLocale: false },
  },
  build: { inlineStylesheets: 'auto' },
});
