import { SITE } from '@/constants/site';
import { NOINDEX } from '@/lib/noindex';

/**
 * Centralized SEO metadata factory.
 * Every route can call `createMetadata({ ... })` to produce a consistent,
 * Open-Graph + Twitter-ready Next.js metadata object with canonical + hreflang.
 *
 * @param {object} [options]
 * @param {string} [options.title]        Page title (without the site suffix)
 * @param {string} [options.description]  Meta description
 * @param {string} [options.path]         Route path, e.g. "/lawyers"
 * @param {string[]} [options.keywords]   Extra keywords
 * @param {string} [options.image]        OG image URL (absolute or root-relative)
 * @param {boolean} [options.noindex]     Exclude the page from search indexes.
 *   The site-wide SITE_NOINDEX switch forces this on for every page.
 * @returns {import('next').Metadata}
 */
export function createMetadata({
  title,
  description = SITE.description,
  path = '/',
  keywords = [],
  image,
  noindex = false,
} = {}) {
  // Brand first so the site name is always visible in the browser tab (tabs
  // truncate from the end), e.g. "Justiceland — <page>".
  const pageTitle = title ? `${SITE.name} — ${title}` : `${SITE.name} — ${SITE.tagline}`;
  const canonical = new URL(path, SITE.url).toString();

  // When no explicit image is passed, the dynamic app/opengraph-image.js is
  // used automatically by Next.js — so we never point at a missing file.
  const images = image
    ? [{ url: image, width: 1200, height: 630, alt: SITE.name }]
    : undefined;

  return {
    // Each page carries its own title. It used to be pinned to the brand name
    // everywhere, which meant a hundred city pages and every practice area all
    // shared one <title> — the single strongest on-page signal a search engine
    // reads, and the label on every browser tab and bookmark.
    title: pageTitle,
    description,
    keywords: [...SITE.keywords, ...keywords],
    alternates: {
      canonical,
      languages: { [SITE.language]: canonical, 'x-default': canonical },
    },
    ...(noindex || NOINDEX
      ? { robots: { index: false, follow: false } }
      : {}),
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      title: pageTitle,
      description,
      url: canonical,
      locale: SITE.locale,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      site: SITE.twitterHandle,
      creator: SITE.twitterHandle,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/**
 * Base metadata applied at the root layout level. Search-engine verification
 * tokens are read from env so they can be set per-environment.
 */
export const baseMetadata = {
  metadataBase: new URL(SITE.url),
  ...createMetadata(),
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: 'Legal Services',
  formatDetection: { telephone: true, address: false, email: false },
  appleWebApp: {
    capable: true,
    title: SITE.shortName,
    statusBarStyle: 'default',
  },
  // This key overrides whatever createMetadata() produced above, so the
  // site-wide switch has to be honoured here too — otherwise every page would
  // go back to INDEX, FOLLOW at the root layout.
  robots: NOINDEX
    ? {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false },
      }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      },
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : {}),
    ...(process.env.BING_SITE_VERIFICATION
      ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } }
      : {}),
  },
  // Icons are provided via the App Router file convention:
  // src/app/icon.png and src/app/apple-icon.png (auto-linked by Next.js).
};
