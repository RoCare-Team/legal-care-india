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
        disallow: ['/api/', '/dashboard/', '/_next/'],
      },
    ],
    sitemap: new URL('/sitemap.xml', SITE.url).toString(),
    host: SITE.url,
  };
}
