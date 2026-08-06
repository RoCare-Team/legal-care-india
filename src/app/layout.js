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
import FloatingContact from '@/components/shared/FloatingContact';
import Analytics from '@/components/shared/Analytics';
import AdvocateCallListener from '@/components/consultation/AdvocateCallListener';
import PresenceProvider from '@/components/consultation/PresenceProvider';
import LocationProvider from '@/components/location/LocationProvider';
import LocationGate from '@/components/location/LocationGate';

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
      logo: new URL('/logo3.png', SITE.url).toString(),
      email: CONTACT.email,
      telephone: CONTACT.phone,
      sameAs: Object.values(SOCIAL),
      address: {
        '@type': 'PostalAddress',
        streetAddress: CONTACT.address.slice(0, 2).join(', '),
        addressLocality: 'Gurugram',
        addressRegion: 'Haryana',
        postalCode: '122018',
        addressCountry: 'IN',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: CONTACT.email,
        telephone: CONTACT.phone,
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
          urlTemplate: `${SITE.url}/lawyers?q={search_term_string}`,
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
          <LocationProvider>
            <HideOnAdmin>
              <Header />
            </HideOnAdmin>
            <main id="main" className="flex-1">
              {children}
            </main>
            <HideOnAdmin>
              <Footer />
            </HideOnAdmin>
            {/* The single location chooser — opened by the header button, and
                by itself on arrival when no location has been set. */}
            <HideOnAdmin>
              <LocationGate />
            </HideOnAdmin>
          </LocationProvider>
        </PresenceProvider>
        <ScrollToTop />
        {/* Decides for itself which routes it belongs on — see FloatingContact. */}
        <FloatingContact />
        <AdvocateCallListener />
        <Analytics />
      </body>
    </html>
  );
}
