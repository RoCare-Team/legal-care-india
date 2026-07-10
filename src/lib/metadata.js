import { SITE } from '@/constants/site';

/**
 * Centralized SEO metadata factory.
 * Every route can call `createMetadata({ ... })` to produce a consistent,
 * Open-Graph + Twitter-ready Next.js metadata object with canonical + hreflang.
 *
 * @param {object} [options]
 * @param {string} [options.title]        Page title (without the site suffix)
 * @param {string} [options.description]  Meta description
 * @param {string} [options.path]         Route path, e.g. "/advocates"
 * @param {string[]} [options.keywords]   Extra keywords
 * @param {string} [options.image]        OG image URL (absolute or root-relative)
 * @param {boolean} [options.noindex]     Exclude the page from search indexes
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
  const pageTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const canonical = new URL(path, SITE.url).toString();

  // When no explicit image is passed, the dynamic app/opengraph-image.js is
  // used automatically by Next.js — so we never point at a missing file.
  const images = image
    ? [{ url: image, width: 1200, height: 630, alt: SITE.name }]
    : undefined;

  return {
    title: pageTitle,
    description,
    keywords: [...SITE.keywords, ...keywords],
    alternates: {
      canonical,
      languages: { [SITE.language]: canonical, 'x-default': canonical },
    },
    ...(noindex
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
  robots: {
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
  // src/app/icon.svg and src/app/apple-icon.svg (auto-linked by Next.js).
};
