import { SITE } from '@/constants/site';
import { NOINDEX } from '@/lib/noindex';

/**
 * robots.txt generator. Next.js serves this at /robots.txt — the first file
 * every crawler reads.
 *
 * With SITE_NOINDEX on, the whole site is closed off and no sitemap is
 * advertised: there is nothing we want fetched, so there is nothing to point at.
 *
 * @returns {import('next').MetadataRoute.Robots}
 */
export default function robots() {
  if (NOINDEX) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      host: SITE.url,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Crawl budget spent on a login form is crawl budget not spent on a
        // lawyer profile. These routes are all `noindex` already; blocking
        // them here stops the fetch happening at all. Kept in step with the
        // noindex set in the page metadata — if one grows, so does the other.
        disallow: [
          '/api/',
          '/_next/',
          '/dashboard/',
          '/admin/',
          '/account/',
          '/login',
          '/user/login',
          '/user/signup',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: new URL('/sitemap.xml', SITE.url).toString(),
    host: SITE.url,
  };
}
