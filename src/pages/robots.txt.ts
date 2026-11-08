import type { APIRoute } from 'astro';
import { INDEXABLE } from '../config/site';
// Production: crawl everything except the noindex brand sheet. Any other
// SITE_ENV (staging/preview): block all crawling.
export const GET: APIRoute = ({ site }) =>
  new Response(
    INDEXABLE
      ? `User-agent: *\nAllow: /\nDisallow: /brand\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`
      : `User-agent: *\nDisallow: /\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
