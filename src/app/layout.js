import './globals.css';
import { fontVariables } from '@/lib/fonts';
import { baseMetadata } from '@/lib/metadata';
import { SITE, SOCIAL, CONTACT } from '@/constants/site';
import { COLORS } from '@/constants/colors';
import { MAIN_NAV } from '@/constants/navigation';
import { siteNavigationSchema } from '@/lib/schema';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HideOnAdmin from '@/components/layout/HideOnAdmin';
import ScrollToTop from '@/components/shared/ScrollToTop';
import Analytics from '@/components/shared/Analytics';
import AdvocateCallListener from '@/components/consultation/AdvocateCallListener';
import PresenceProvider from '@/components/consultation/PresenceProvider';

/** Root metadata for every route (extend per-page with createMetadata). */
export const metadata = baseMetadata;

export const viewport = {
  themeColor: COLORS.primary,
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * Site-wide JSON-LD graph: Organization (logo, socials, contact point for the
 * knowledge panel), WebSite (with a SearchAction for the sitelinks search box)
 * and the primary SiteNavigation.
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
      email: CONTACT.email,
      sameAs: Object.values(SOCIAL),
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: CONTACT.email,
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
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
    siteNavigationSchema(MAIN_NAV),
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Speed up third-party + remote-image connections */}
        <link rel="preconnect" href="https://upload.wikimedia.org" crossOrigin="" />
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <PresenceProvider>
          <HideOnAdmin>
            <Header />
          </HideOnAdmin>
          <main id="main" className="flex-1">
            {children}
          </main>
          <HideOnAdmin>
            <Footer />
          </HideOnAdmin>
        </PresenceProvider>
        <ScrollToTop />
        <AdvocateCallListener />
        <Analytics />
      </body>
    </html>
  );
}
