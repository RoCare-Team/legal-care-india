import './globals.css';
import { fontVariables } from '@/lib/fonts';
import { baseMetadata } from '@/lib/metadata';
import { SITE, SOCIAL } from '@/constants/site';
import { COLORS } from '@/constants/colors';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/shared/ScrollToTop';

/** Root metadata for every route (extend per-page with createMetadata). */
export const metadata = baseMetadata;

export const viewport = {
  themeColor: COLORS.primary,
  width: 'device-width',
  initialScale: 1,
};

/**
 * Site-wide JSON-LD. An Organization node (logo + social profiles for the
 * knowledge panel) and a WebSite node with a SearchAction, which lets Google
 * show a sitelinks search box for the brand.
 */
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      logo: new URL('/icon.svg', SITE.url).toString(),
      sameAs: Object.values(SOCIAL),
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      publisher: { '@id': `${SITE.url}/#organization` },
      inLanguage: 'en-IN',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE.url}/advocates?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
