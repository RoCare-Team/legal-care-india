import { SITE } from '@/constants/site';
import { NOINDEX } from '@/lib/noindex';

/**
 * The canonical URL for a route.
 *
 * Normalised on the way in so every page agrees on one spelling of itself:
 * the site's own origin (never www if the site is not www, never http), the
 * path lower-cased, query strings and fragments dropped, and no trailing
 * slash except at the root. Two spellings of one URL is duplicate content,
 * and the crawler picks which one to keep.
 *
 * @param {string} path  route path, e.g. "/civil-lawyer-in-delhi"
 * @returns {string} absolute URL
 */
export function canonicalUrl(path = '/') {
  const url = new URL(path || '/', SITE.url);
  url.search = '';
  url.hash = '';
  url.pathname = url.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  return url.toString();
}

/**
 * How long a title can run before a search result truncates it. The brand
 * suffix `createMetadata` appends is counted against the same budget.
 */
const TITLE_MAX = 60;
const BRAND_SUFFIX = ` | ${SITE.name}`.length;

/**
 * `base`, with `tail` appended only if the finished title still fits.
 *
 * A tail is what turns "Lawyers in Delhi" into something worth clicking, but
 * blindly appending one to "Restitution of Conjugal Rights Lawyers in
 * Visakhapatnam" produces a title Google cuts off mid-word — and the words it
 * cuts are the tail, so the cost is paid for no benefit. Short names get the
 * tail; long ones are already descriptive enough without it.
 *
 * @param {string} base  e.g. "Civil Lawyers in Delhi"
 * @param {string} tail  e.g. "Verified & Online"
 * @returns {string}
 */
export function withTail(base, tail) {
  const joined = `${base} — ${tail}`;
  return joined.length + BRAND_SUFFIX <= TITLE_MAX ? joined : base;
}

/**
 * A practice area's name as it reads in a title.
 *
 * `CATEGORIES` stores "Civil Law", "Criminal Law", "Family Law" — correct as a
 * label, but "Civil Law Lawyers" is not a phrase anyone types or says. The
 * trailing "Law" comes off so the title reads "Civil Lawyers in Delhi".
 * Names that do not end in "Law" ("Intellectual Property", "Labour &
 * Employment") are left exactly as they are.
 *
 * @param {string} name
 * @returns {string}
 */
export function practiceLabel(name) {
  return String(name || '').replace(/\s+Law$/i, '').trim() || String(name || '');
}

/**
 * Centralized SEO metadata factory.
 * Every route can call `createMetadata({ ... })` to produce a consistent,
 * Open-Graph + Twitter-ready Next.js metadata object with canonical + hreflang.
 *
 * @param {object} [options]
 * @param {string} [options.title]        Page title (without the site suffix)
 * @param {string} [options.description]  Meta description
 * @param {string} [options.path]         Route path, e.g. "/lawyers"
 * @param {string[]} [options.keywords]   Page-specific keywords. When empty the
 *   site-wide list is used, so a page never ships someone else's terms.
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
  // Keyword first, brand last — "Property Lawyers in Gurgaon | Justiceland".
  //
  // It used to read "Justiceland — Property Lawyers in Gurgaon". That put the
  // same eleven characters at the front of every title on the site, which is
  // the part a search engine weights most and the part a result listing shows
  // before it truncates. The brand is worth carrying, but at the end.
  //
  // A title that already says the brand does not get it a second time. Pages
  // like "About Justiceland" and "How Lawyers Are Verified on Justiceland"
  // name the company as part of the sentence, and blindly appending the suffix
  // produced "About Justiceland | India's Lawyer Directory | Justiceland" —
  // which reads as a mistake and spends characters that a search result would
  // otherwise show.
  const named = title && new RegExp(`\\b${SITE.name}\\b`, 'i').test(title);
  const pageTitle = title
    ? (named ? title : `${title} | ${SITE.name}`)
    : `${SITE.name} — ${SITE.tagline}`;

  // A canonical is only correct if it is the URL the page actually answers on:
  // one origin, no query string, no trailing slash except at the root. Anything
  // else and two URLs claim to be the same page — or worse, point at each other.
  const canonical = canonicalUrl(path);

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
    // The page's own keywords, not the site's appended to them. Shipping the
    // same nine terms on every page told a crawler that a Gurgaon property
    // page and a blog post about court fees were about the same thing. The
    // site-wide list is the fallback for pages that have nothing more
    // specific to say — the home page, mostly.
    keywords: keywords.length ? keywords : SITE.keywords,
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
    // The Search Console token. It ships in the code rather than the
    // environment because it is public either way — it is served in the HTML
    // of every page — and an env var would have to be set again on Vercel,
    // where forgetting it silently un-verifies the property. The env var still
    // wins if set, so a different property can be pointed at without a commit.
    google: process.env.GOOGLE_SITE_VERIFICATION || 'ADk9WTe4LUB5pciHiKXtM_EB_ZvxjWSLhxlGIn57uGI',
    ...(process.env.BING_SITE_VERIFICATION
      ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } }
      : {}),
  },
  // Icons are provided via the App Router file convention:
  // src/app/icon.png and src/app/apple-icon.png (auto-linked by Next.js).
};
